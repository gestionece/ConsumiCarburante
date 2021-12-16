var app = new Vue({
    el: '#app',
    data: {
        CpList: [],
        CpTable: [],
        CpTot: [],
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
    methods: {
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
        SorteTableN(sorted) { //al posto di ataddare il SORT si potrebbe prima convertire CpList in un array, cosi da filtrare in pase al index della colona

            if (Math.abs(sorted) == this.sort) {
                this.CpTable = this.CpTable.reverse();
                this.sort *= -1;
                return;
            }

            this.CpTable = this.CpTable.sort(function (a, b) {
                var A = a[Math.abs(sorted) - 1];
                var B = b[Math.abs(sorted) - 1];
                return A - B
            });

            this.sort = sorted;
        },
        loadFile(selectedFile) {
            if (selectedFile && window.Worker) {

                this.page_CpList_loader = true;
                this.btnLoad_isDisabled = true;
                const worker = new Worker('resource/js/worker.js'); //https://dog.ceo/dog-api/
                worker.postMessage(selectedFile);
                worker.onmessage = (e) => {

                    let loadFileData = e.data; //uso worker.js per ricevere già JSON dal file EXCEL, problema consite nel riceve due volte, visto che ci sono pagine diverse(si potrebbe valuitare di utlizare un foglio per un contratto).
                    //console.log(loadFileData);

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
                                IMPORTO: [],
                                DATA: [],
                                LOCALITÀ: [],
                                AUTISTA: [],
                                L_TOT: 0,
                                KM_TOT: 0,
                                IMPORTO_TOT: 0,
                                BU_KM: row.CHILOMETRAGGIO,
                                KM_ERROR: false,
                            };
                        }

                        if (row["PREZZO UNITARIO"] > 1 && row["PREZZO UNITARIO"] < 10 && row.QUANTITÀ != 0) {//&& row.CHILOMETRAGGIO > 10 //row.QUANTITÀ != 0 PREZZO UNITARIO

                            this.CpList.TARGA[row.TARGA].KM.push(row.CHILOMETRAGGIO);

                            this.CpList.TARGA[row.TARGA].DATA.push(row.DATA.substring(0, 10));
                            this.CpList.TARGA[row.TARGA].LOCALITÀ.push(row.LOCALITÀ);
                            this.CpList.TARGA[row.TARGA].AUTISTA.push(row["CODICE AUTISTA"]);

                            this.CpList.TARGA[row.TARGA].L.push(row.QUANTITÀ);
                            this.CpList.TARGA[row.TARGA].L_TOT += row.QUANTITÀ;

                            this.CpList.TARGA[row.TARGA].IMPORTO.push(row.IMPORTO);
                            this.CpList.TARGA[row.TARGA].IMPORTO_TOT += row.IMPORTO;

                            if ((row.TARGA).substring(0, 3) == "CIS") {
                                this.CpList.TOTALE.L_CIS += row.QUANTITÀ;
                            } else {
                                this.CpList.TOTALE.L_VEI += row.QUANTITÀ;
                            }

                            if ( row.CHILOMETRAGGIO > 10 && this.CpList.TARGA[row.TARGA].BU_KM > 10 && row.CHILOMETRAGGIO > this.CpList.TARGA[row.TARGA].BU_KM && (row.TARGA).substring(0, 3) != "CIS") { //row.CHILOMETRAGGIO > 10 && this.CpList.TARGA[row.TARGA].BU_KM > 10

                                this.CpList.TARGA[row.TARGA].KM_TOT += row.CHILOMETRAGGIO - this.CpList.TARGA[row.TARGA].BU_KM;
                                this.CpList.TOTALE.KM_VEI += row.CHILOMETRAGGIO - this.CpList.TARGA[row.TARGA].BU_KM;

                                this.CpList.TARGA[row.TARGA].BU_KM = row.CHILOMETRAGGIO;
                            } 

                            if (row.CHILOMETRAGGIO < 10 || row.CHILOMETRAGGIO < this.CpList.TARGA[row.TARGA].BU_KM) {
                                this.CpList.TARGA[row.TARGA].KM_ERROR = true;
                            }

                        }
                    });

                    console.log(this.CpList);

                    this.CpTot = [
                        ["Cisterna", 0, (this.CpList.TOTALE.L_CIS).toFixed(2)],
                        ["Veicolo", (this.CpList.TOTALE.KM_VEI).toFixed(0), (this.CpList.TOTALE.L_VEI).toFixed(2)],
                    ];
                    console.log(this.CpTot);

                    this.CpTable = [];
                    Object.keys(this.CpList.TARGA).forEach(element => {
                        this.CpTable.push([element, this.CpList.TARGA[element].DATA[0], this.CpList.TARGA[element].DATA[this.CpList.TARGA[element].DATA.length - 1], this.CpList.TARGA[element].KM_TOT.toFixed(0), this.CpList.TARGA[element].L_TOT.toFixed(2), this.CpList.TARGA[element].KM_ERROR, this.CpList.TARGA[element].IMPORTO_TOT.toFixed(2)]);
                    });
                    console.log(this.CpTable);

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