importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.16.2/xlsx.full.min.js');
onmessage = (e) => {
    let data = [{}];
    XLSX.utils.json_to_sheet(data, 'out.xlsx');
    if (e.data) {
        let fileReader = new FileReader();
        fileReader.readAsBinaryString(e.data);
        fileReader.onload = (event) => {
            let data = event.target.result;
            let workbook = XLSX.read(data, { type: "binary", cellDates: true, dateNF: 'dd/mm/yyyy' });
            /*postMessage(workbook);*/ // uso worker.js per caricare e leggere il file, ma per conversione delle pagine diverse uso main.js
            workbook.SheetNames.forEach(sheet => {
                let rowObject = XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
                //File load and ...
                postMessage(rowObject);
            });
        }
    }
}