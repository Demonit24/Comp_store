/**
 * Утилита для скачивания файлов
 */
export const downloadFile = (data, filename, mimeType) => {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };
  
  /**
   * Скачивание PDF файла
   */
  export const downloadPdf = (pdfData, filename = 'report.pdf') => {
    downloadFile(pdfData, filename, 'application/pdf');
  };
  
  /**
   * Скачивание CSV файла
   */
  export const downloadCsv = (csvData, filename = 'report.csv') => {
    downloadFile(csvData, filename, 'text/csv');
  };