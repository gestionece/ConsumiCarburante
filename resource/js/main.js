var app = new Vue({
    el: '#app',
    data: {
        CpList: [],
        CpTable: [],
        selectedFile_name: "",
        page_loadFile: true,
        page_CpList: false,
        btnLoad_isDisabled: false,
        page_CpList_loader: false,
        modal_show_data: false,
        modal_CP: "",
        modal_CE: [],
        modal_link: true,
        edit_Barcode: null,
        loadVue: true,
        showBarCodeCP: false,

        sort: 1,
    },
    computed: {
        geTable() {
            let table = [];
            Object.keys(this.CpList).forEach(element => {
                let temp = [element, this.CpList[element].status, this.CpList[element].CE.length, this.CpList[element].CE_Error.length];
                table.push(temp);
            });
            return table;
        },
    },
    methods: {
        DownloadAll() {
            Object.keys(app.CpList).forEach(CP => {
                let url = "https://geco.impresalevratti.it/admin/backend/pallet/?q=" + CP + "#download";
                window.open(url, '_blank');
            });
        },
        DownloadCELIst(CP, CE) {
            var data = CP;
            CE.forEach(function (code) {
                data += '\n' + code;
            });

            this.download(data, CP, ".txt");
        },
        OpenBarCode(CE) {
            if (this.edit_Barcode != null && this.edit_Barcode == CE) {
                this.edit_Barcode = null;
            } else {
                this.edit_Barcode = CE;
            }
        },
        CheckErrorCE(CE) {
            if (this.modal_link == false) {
                return false;
            } else {
                return this.CpList[this.modal_CP].CE_Error.find(element => element == CE)
            }
        },
        SorteTable(sorted) { //al posto di ataddare il SORT si potrebbe prima convertire CpList in un array, cosi da filtrare in pase al index della colona

            if (Math.abs(sorted) == this.sort) {
                this.CpTable = this.CpTable.reverse();
                this.sort *= -1;
                return;
            }

            this.CpTable = this.CpTable.sort(function (a, b) {
                var A = a[Math.abs(sorted) - 1];
                var B = b[Math.abs(sorted) - 1];
                if (A < B) {
                    return -1;
                }
                if (A > B) {
                    return 1;
                }

                // names must be equal
                return 0;
            });

            this.sort = sorted;
        },
        // diff between just two arrays:
        arrayDiff(a, b) {
            var arrays = Array.prototype.slice.call(arguments);
            var diff = [];

            arrays.forEach(function (arr, i) {
                var other = i === 1 ? a : b;
                arr.forEach(function (x) {
                    if (other.indexOf(x) === -1) {
                        diff.push(x);
                    }
                });
            })

            return diff;
        },
        openDataGeco(cp, ce, link) {
            this.modal_CP = cp;
            this.modal_CE = ce;
            this.modal_link = link;
            this.modal_show_data = true;
        },
        openConfrGeco(cp, result) {
            if (this.CpList[cp].Result == false) {
                this.openDataGeco("Sono identici", [], false);
            } else {
                this.modal_link = true;
                this.modal_CP = cp;
                this.modal_CE = result;
                this.modal_show_data = true;
            }
        },
        loadFile(selectedFile) {
            if (selectedFile && window.Worker) {

                this.page_CpList_loader = true;
                this.btnLoad_isDisabled = true;
                const worker = new Worker('resource/js/worker.js'); //https://dog.ceo/dog-api/
                worker.postMessage(selectedFile);
                worker.onmessage = (e) => {

                    let loadFileData = e.data; //uso worker.js per ricevere già JSON dal file EXCEL, problema consite nel riceve due volte, visto che ci sono pagine diverse(si potrebbe valuitare di utlizare un foglio per un contratto).
                    console.log(loadFileData);

                    this.CpList = {
                        TARGA: [],
                        TOTALE: {
                            KM_VEI: 0,
                            L_CIS: 0,
                            L_VEI: 0
                        }
                    };

                    this.selectedFile_name = selectedFile.name;

                    loadFileData.forEach(row => {
                        if (this.CpList.TARGA[row.TARGA] == undefined) {
                            this.CpList.TARGA[row.TARGA] = {
                                KM: [],
                                L: [],
                                DATA: [],

                                L_TOT: 0,

                                KM_TOT: 0,
                                KM_B: row.CHILOMETRAGGIO
                            };
                        }

                        if (row.QUANTITÀ != 0) {
                            this.CpList.TARGA[row.TARGA].KM.push(row.CHILOMETRAGGIO);
                            this.CpList.TARGA[row.TARGA].L.push(row.QUANTITÀ);
                            this.CpList.TARGA[row.TARGA].DATA.push(row.DATA);

                            this.CpList.TARGA[row.TARGA].L_TOT += row.QUANTITÀ;

                            this.CpList.TARGA[row.TARGA].KM_TOT += row.CHILOMETRAGGIO - this.CpList.TARGA[row.TARGA].KM_B;

                            if ((row.TARGA).substring(0,3) == "CIS") {
                                this.CpList.TOTALE.L_CIS += row.QUANTITÀ;
                            } else {
                                this.CpList.TOTALE.L_VEI += row.QUANTITÀ;
                                this.CpList.TOTALE.KM_VEI += row.CHILOMETRAGGIO - this.CpList.TARGA[row.TARGA].KM_B;
                            }

                            this.CpList.TARGA[row.TARGA].KM_B = row.CHILOMETRAGGIO;
                        }

                        /*if (row.CEID_ASSEGNATO_IMPRESA == "NO") {
                            this.CpList[row.CASARSID].status = "KO";
                            this.CpList[row.CASARSID].CE_Error.push(row.CEID);
                        }*/

                        //this.CpList[row.TARGA].CE.push(row.CEID);
                    });

                    console.log(this.CpList);

                    /*this.CpTable = [];
                    Object.keys(this.CpList).forEach(element => {
                        this.CpTable.push([element, this.CpList[element].status, this.CpList[element].CE.length, this.CpList[element].CE_Error.length, false, false]);
                    });*/

                    this.page_loadFile = false;
                    this.page_CpList = true;

                    this.page_CpList_loader = false;
                    this.btnLoad_isDisabled = false;

                    worker.terminate();
                }
            }
        },
        backLCList() {
            this.modal_show_data = false;
            this.page_loadFile = true;
            this.page_CpList = false;
        },
        download(data, filename, type) {
            var file = new Blob([data], { type: type });
            if (window.navigator.msSaveOrOpenBlob) // IE10+
                window.navigator.msSaveOrOpenBlob(file, filename);
            else { // Others
                var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(function () {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 0);
            }
        }
    }
});