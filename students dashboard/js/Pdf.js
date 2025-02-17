// ... existing code ...

// New function to handle page printing
function handlePrintPage() {
  const previewImage = document.getElementById('pdfPreviewImage');
  if (!previewImage) return;

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print PDF Page</title>
      <style>
        body { 
          margin: 0; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          background-color: #f0f0f0;
        }
        img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <img src="${previewImage.src}" alt="PDF Page" onload="window.print(); window.onafterprint = () => window.close();">
    </body>
    </html>
  `);

  // Close the print window after printing
  printWindow.document.close();
}

// ... existing code ...