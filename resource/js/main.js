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
                let nFile = selectedFile.length;

                let loadFileData = [];

                let readFile = (index) => {
                    if (index >= selectedFile.length) return;
                    var file = selectedFile[index];

                    worker.postMessage(file);

                    worker.onmessage = (e) => {

                        loadFileData = loadFileData.concat(e.data); //uso worker.js per ricevere già JSON dal file EXCEL, problema consite nel riceve due volte, visto che ci sono pagine diverse(si potrebbe valuitare di utlizare un foglio per un contratto).

                        nFile--;

                        if (nFile == 0) {

                            this.CpList = {
                                TARGA: [],
                                TOTALE: {
                                    KM_VEI: 0,
                                    L_CIS: 0,
                                    L_VEI: 0,

                                    KM_TOT_M: {
                                        gennaio: 0,
                                        febbraio: 0,
                                        marzo: 0,
                                        aprile: 0,
                                        maggio: 0,
                                        giugno: 0,
                                        luglio: 0,
                                        agosto: 0,
                                        settembre: 0,
                                        ottobre: 0,
                                        novembre: 0,
                                        dicembre: 0,
                                    }
                                }
                            };

                            this.selectedFile_name = selectedFile.name;

                            loadFileData.forEach(row => {
                                if (this.CpList.TARGA[row.TARGA] == undefined) {
                                    this.CpList.TARGA[row.TARGA] = {
                                        TRANSAZIONI: [],
                                        L_TOT: 0,
                                        KM_TOT: 0,
                                        IMPORTO_TOT: 0,
                                        BU_KM: row.CHILOMETRAGGIO,
                                        KM_ERROR: false,

                                        KM_TOT_M: {
                                            gennaio: 0,
                                            febbraio: 0,
                                            marzo: 0,
                                            aprile: 0,
                                            maggio: 0,
                                            giugno: 0,
                                            luglio: 0,
                                            agosto: 0,
                                            settembre: 0,
                                            ottobre: 0,
                                            novembre: 0,
                                            dicembre: 0,
                                        }
                                    };
                                }

                                if (row["STATO AUTORIZZATIVO"] == "Approvata" &&
                                    row["PREZZO UNITARIO"] > 1 &&
                                    row["PREZZO UNITARIO"] < 10 &&
                                    row.QUANTITÀ != 0) {

                                    this.CpList.TARGA[row.TARGA].L_TOT += row.QUANTITÀ;
                                    this.CpList.TARGA[row.TARGA].IMPORTO_TOT += row.IMPORTO;

                                    if ((row.TARGA).substring(0, 3) == "CIS") {
                                        this.CpList.TOTALE.L_CIS += row.QUANTITÀ;
                                    } else {
                                        this.CpList.TOTALE.L_VEI += row.QUANTITÀ;
                                    }

                                    if (row.CHILOMETRAGGIO > 10 && this.CpList.TARGA[row.TARGA].BU_KM > 10 && row.CHILOMETRAGGIO > this.CpList.TARGA[row.TARGA].BU_KM && (row.TARGA).substring(0, 3) != "CIS") { //row.CHILOMETRAGGIO > 10 && this.CpList.TARGA[row.TARGA].BU_KM > 10

                                        //this.CpList.TARGA[row.TARGA].KM_TOT += row.CHILOMETRAGGIO - this.CpList.TARGA[row.TARGA].BU_KM;
                                        this.CpList.TOTALE.KM_VEI += row.CHILOMETRAGGIO - this.CpList.TARGA[row.TARGA].BU_KM;

                                        this.CpList.TARGA[row.TARGA].BU_KM = row.CHILOMETRAGGIO;
                                    }

                                    if (row.CHILOMETRAGGIO < 10 || row.CHILOMETRAGGIO < this.CpList.TARGA[row.TARGA].BU_KM) {
                                        this.CpList.TARGA[row.TARGA].KM_ERROR = true;
                                    }

                                    let Data = row.DATA.substring(0, 10).split('-');

                                    //const month = new Date(Data[2], Data[1] - 1, Data[0]).toLocaleString('default', { month: 'long' });

                                    this.CpList.TARGA[row.TARGA].TRANSAZIONI.push({
                                        //PRODOTTO: row["DESCRIZIONE PRODOTTO 1"],
                                        //PREZZO: row["PREZZO UNITARIO"],
                                        KM: row.CHILOMETRAGGIO,
                                        L: row.QUANTITÀ,
                                        //IMPORTO: row.IMPORTO,
                                        DATA: new Date(Data[2], Data[1] - 1, Data[0]),
                                        //LOCALITÀ: row.LOCALITÀ,
                                        //AUTISTA: row["CODICE AUTISTA"],
                                    });
                                }
                            });

                            console.log(this.CpList);

                            this.CpTot = [
                                ["Cisterna", 0, (this.CpList.TOTALE.L_CIS).toFixed(2)],
                                ["Veicolo", (this.CpList.TOTALE.KM_VEI).toFixed(0), (this.CpList.TOTALE.L_VEI).toFixed(2)],
                            ];
                            //console.log(this.CpTot);

                            /*this.CpTable = [];
                            Object.keys(this.CpList.TARGA).forEach(element => {
                                this.CpTable.push([element, this.CpList.TARGA[element].DATA[0], this.CpList.TARGA[element].DATA[this.CpList.TARGA[element].DATA.length - 1], this.CpList.TARGA[element].KM_TOT.toFixed(0), this.CpList.TARGA[element].L_TOT.toFixed(2), this.CpList.TARGA[element].KM_ERROR, this.CpList.TARGA[element].IMPORTO_TOT.toFixed(2)]);
                            });*/
                            //console.log(this.CpTable);

                            //console.log(loadFileData);

                            let tot = 0;
                            Object.keys(this.CpList.TARGA).forEach(targa => {
                                let EstrattoTarga = this.CpList.TARGA[targa].TRANSAZIONI.sort(function (a, b) {
                                    return a.DATA - b.DATA;
                                });
                                
                                //console.log(EstrattoTarga);

                                let min = 0;
                                for (let i = 0; i < EstrattoTarga.length - 1; i++) {
                                    if ((targa).substring(0, 3) != "CIS") {
                                        if (EstrattoTarga[i].KM > min) {
                                            min = EstrattoTarga[i].KM;
                                        }
                                        if (EstrattoTarga[i + 1].KM > min && min > 5) {
                                            //console.log(i + ": " + EstrattoTarga[i + 1].KM + " + " + min + " = " + (EstrattoTarga[i + 1].KM - min));

                                            this.CpList.TARGA[targa].KM_TOT += EstrattoTarga[i + 1].KM - min;
                                            this.CpList.TARGA[targa].KM_TOT_M[EstrattoTarga[i + 1].DATA.toLocaleString('default', { month: 'long' })] += EstrattoTarga[i + 1].KM - min;
                                            this.CpList.TOTALE.KM_TOT_M[EstrattoTarga[i + 1].DATA.toLocaleString('default', { month: 'long' })] += EstrattoTarga[i + 1].KM - min;
                                            tot += EstrattoTarga[i + 1].KM - min;
                                       
                                        }
                                    }
                                }
                                console.log(targa + ": " + this.CpList.TARGA[targa].KM_TOT);
                            });

                            console.log(tot);


                            this.page_loadFile = false;
                            this.page_CpList = true;

                            this.page_CpList_loader = false;
                            this.btnLoad_isDisabled = false;

                            worker.terminate();
                        }
                    }
                    readFile(index + 1);
                }
                readFile(0);
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