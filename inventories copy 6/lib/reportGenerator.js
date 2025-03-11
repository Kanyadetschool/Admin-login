export class ReportGenerator {
    static async generateInventoryReport() {
        const data = window.inventoryData || [];
        const categories = [...new Set(data.map(item => item.category))];
        
        let content = '<div class="report">';
        content += `<h2>Inventory Report</h2>
                   <p>Generated on: ${new Date().toLocaleString()}</p>`;

        for (const category of categories) {
            const items = data.filter(item => item.category === category);
            const totalValue = items.reduce((sum, item) => sum + (item.value * item.quantity), 0);
            
            content += `
                <div class="category-section">
                    <h3>${category}</h3>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Quantity</th>
                                <th>Value</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.id}</td>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.value.toLocaleString()}</td>
                                    <td>${item.status}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td colspan="3">Total Value</td>
                                <td colspan="2">$${totalValue.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        content += '</div>';
        return content;
    }
}
