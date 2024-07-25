class PortfolioCalculator {
    constructor() {
        this.positionCount = 0;
        this.buyingPower = 0;
        this.initialEquityInput = document.getElementById("initialEquity");
        this.buyingPowerInput = document.getElementById("buyingPower");
        this.positionsContainer = document.getElementById("positions");
        this.addEventListeners();
        this.addPositionFields();
    }
    addEventListeners() {
        this.initialEquityInput.addEventListener('input', () => this.updateBuyingPower());
        document.querySelectorAll('input[name="leverage"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateBuyingPower());
        });
    }
    addPositionFields() {
        this.positionCount++;
        const container = document.createElement("div");
        container.className = "position-container";
        container.id = "positionContainer" + this.positionCount;
        container.innerHTML = `
                        <label>Position Type (${this.positionCount}):</label>
                        <select id="positionType${this.positionCount}">
                            <option value="long">Long</option>
                            <option value="short">Short</option>
                        </select><br>
                        <label>Number of Shares (${this.positionCount}):</label>
                        <input type="number" id="numberOfShares${this.positionCount}"><br>
                        <label>Avg Px | Closing Px (${this.positionCount}):</label>
                        <input type="number" id="averagePrice${this.positionCount}" step="0.01"><br>
                        <label>Current Stock Price (${this.positionCount}):</label>
                        <input type="number" id="currentPrice${this.positionCount}" step="0.01"><br>
                        
                        <label>Realized P&L (${this.positionCount}):</label>
                        <input type="number" id="plRealized${this.positionCount}" step="0.01"><br>
                        
                        
                        <p class="position-reminder">
                        Please ensure that any positions created  <br> align
                        with the buying power you have entered.  <br> Exceeding
                        your buying power may lead to inaccurate calculations.</p>
                        <input type="button" class="delete-button" value="Delete Position" onclick="portfolioCalculator.deletePosition(${this.positionCount})"><br><br>`;
        this.positionsContainer.appendChild(container);
    }
    deletePosition(positionNumber) {
        const container = document.getElementById("positionContainer" + positionNumber);
        if (container) {
            container.remove();
            this.positionCount--;
            this.calculateTotals();
        }
    }
    updateBuyingPower() {
        const initialEquityValue = parseFloat(this.initialEquityInput.value) || 0;
        const leverage = document.querySelector('input[name="leverage"]:checked').value;
        this.buyingPower = (initialEquityValue * leverage).toFixed(2);
        this.buyingPowerInput.value = this.buyingPower;
    }
    
    calculateTotals() {
        let totalExposure = 0, totalPL = 0, initialInvestment = 0;
        const initialEquity = parseFloat(this.initialEquityInput.value) || 0;
    
        for (let i = 1; i <= this.positionCount; i++) {
            let plRealized = this._getInputValue(`plRealized${i}`);
            let numberOfShares = this._getInputValue(`numberOfShares${i}`);
            let averagePrice = this._getInputValue(`averagePrice${i}`);
            let currentPrice = this._getInputValue(`currentPrice${i}`);
            let positionType = document.getElementById(`positionType${i}`).value;
            let pl = positionType === "long" ?
                (currentPrice - averagePrice) * numberOfShares :
                (averagePrice - currentPrice) * numberOfShares;
    
            totalPL += (pl + plRealized);
            initialInvestment += numberOfShares * averagePrice;
            totalExposure += numberOfShares * currentPrice;
        }
    
        const netEquity = initialEquity + totalPL;
        const priceFor25EquityRatio = this.calculatePriceForEquityRatio(25);
        const priceFor15EquityRatio = this.calculatePriceForEquityRatio15(15)

    
        // Calculate and cap the equity ratio at 100%
        let equityRatio = (netEquity / totalExposure) * 100;
        // Calculate the price for 25% equity ratio
        equityRatio = equityRatio > 100 ? 100 : equityRatio;
    
        // Update the fields
        document.getElementById("initialInvestment").value = this.formatCurrency(initialInvestment);
        document.getElementById("netEquity").value = this.formatCurrency(netEquity);
        document.getElementById("totalExposure").value = this.formatCurrency(totalExposure);
        document.getElementById("equityRatio").value = this.formatPercentage(equityRatio);
        document.getElementById("priceFor25EquityRatio").value = this.formatCurrency(priceFor25EquityRatio); //new
        document.getElementById("priceFor15EquityRatio").value = this.formatCurrency(priceFor15EquityRatio);
    
        // Update Net P&L with color based on value
        const netPLField = document.getElementById("totalPL");
        netPLField.value = this.formatCurrency(totalPL);
        this.updateFieldColor(netPLField, totalPL);
    
        // Update Total Return with color based on value
        const totalReturnField = document.getElementById("plPercentage");
        const totalReturn = totalPL / initialInvestment * 100;
        totalReturnField.value = this.formatPercentage(totalReturn);
        this.updateFieldColor(totalReturnField, totalReturn);

        this.updateGraph();
    }
    
    //new
    calculatePriceForEquityRatio() {
        if (this.positionCount === 0) {
            return 0; // No positions to calculate
        }
    
        let numberOfShares = this._getInputValue(`numberOfShares1`);
        if (numberOfShares <= 0) {
            return 0; // Avoid division by zero or negative shares
        }
    
        const initialEquity = parseFloat(this.initialEquityInput.value) || 0;
        let positionType = document.getElementById(`positionType1`).value;
    
        // Only calculate for short positions
        if (positionType !== 'short') {
            return 0;
        }
    
        let averagePrice = this._getInputValue(`averagePrice1`);
        let realizedPL = this._getInputValue(`plRealized1`);
    
        // Use a numerical method to find the estimated stock price for 25% equity ratio
        let desiredPrice = averagePrice; // Start with average price as initial guess
        let step = 0.01; // Incremental step for adjusting price
        let iterationLimit = 10000; // Limit iterations to prevent infinite loop
        let tolerance = 0.01; // Tolerance for the equity ratio
    
        for (let i = 0; i < iterationLimit; i++) {
            let netEquity = initialEquity + realizedPL + (averagePrice - desiredPrice) * numberOfShares;
            let totalExposure = desiredPrice * numberOfShares;
            let currentEquityRatio = (netEquity / totalExposure) * 100;
    
            if (Math.abs(currentEquityRatio - 25) <= tolerance) {
                break; // Equity ratio is close to 25%
            } else if (currentEquityRatio < 25) {
                desiredPrice -= step; // Decrease price if equity ratio is less than 25%
            } else {
                desiredPrice += step; // Increase price if equity ratio is greater than 25%
            }
        }
    
        return desiredPrice > 0 ? desiredPrice : 0;
    }
    
    calculatePriceForEquityRatio15() {
        if (this.positionCount === 0) {
            return 0; // No positions to calculate
        }
    
        let numberOfShares = this._getInputValue(`numberOfShares1`);
        if (numberOfShares <= 0) {
            return 0; // Avoid division by zero or negative shares
        }
    
        const initialEquity = parseFloat(this.initialEquityInput.value) || 0;
        let positionType = document.getElementById(`positionType1`).value;
    
        // Only calculate for short positions
        if (positionType !== 'short') {
            return 0;
        }
    
        let averagePrice = this._getInputValue(`averagePrice1`);
        let realizedPL = this._getInputValue(`plRealized1`);
    
        // Use a numerical method to find the estimated stock price for 15% equity ratio
        let desiredPrice = averagePrice; // Start with average price as initial guess
        let step = 0.01; // Incremental step for adjusting price
        let iterationLimit = 10000; // Limit iterations to prevent infinite loop
        let tolerance = 0.01; // Tolerance for the equity ratio
    
        for (let i = 0; i < iterationLimit; i++) {
            let netEquity = initialEquity + realizedPL + (averagePrice - desiredPrice) * numberOfShares;
            let totalExposure = desiredPrice * numberOfShares;
            let currentEquityRatio = (netEquity / totalExposure) * 100;
    
            if (Math.abs(currentEquityRatio - 15) <= tolerance) {
                break; // Equity ratio is close to 15%
            } else if (currentEquityRatio < 15) {
                desiredPrice -= step; // Decrease price if equity ratio is less than 15%
            } else {
                desiredPrice += step; // Increase price if equity ratio is greater than 15%
            }
        }
    
        return desiredPrice > 0 ? desiredPrice : 0;
    }
    
    
    
    
    

    
    
    
    
    
//new
    updateGraph() {
        const ctx = document.getElementById('stockGraph').getContext('2d');
        const currentStockPrice = this._getInputValue('currentPrice1');
        const priceFor25EquityRatio = parseFloat(document.getElementById("priceFor25EquityRatio").value.replace(/[^0-9.-]+/g, "")) || 0;
        const priceFor15EquityRatio = parseFloat(document.getElementById("priceFor15EquityRatio").value.replace(/[^0-9.-]+/g, "")) || 0;
        
        // Destroy the existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
    
        const data = {
            labels: ['Current Stock Price', 'Price for Equity Ratios'],
            datasets: [
                {
                    label: '25% Equity Ratio Price',
                    data: [currentStockPrice, priceFor25EquityRatio],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    fill: false,
                    tension: 0 // This ensures the line is straight.
                },
                {
                    label: '15% Equity Ratio Price',
                    data: [currentStockPrice, priceFor15EquityRatio],
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    fill: false,
                    tension: 0 // This ensures the line is straight.
                }
            ]
        };
    
        // Save the new chart instance to this.chart
        this.chart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    },
                    x: {
                        // This setting ensures that each point is placed in its own category on the x-axis.
                        type: 'category',
                        labels: ['Current Stock Price', 'Price for Equity Ratios']
                    }
                }
            }
        });
    }

    
    updateFieldColor(field, value) {
        field.classList.remove('positive', 'negative'); // Remove previous classes
    
        if (value < 0) {
            field.classList.add('negative');
        } else if (value > 0) {
            field.classList.add('positive');
        }
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    }

    formatPercentage(value) {
        return value.toFixed(2) + '%';
    }
    _getInputValue(id) {
        const input = document.getElementById(id);
        if (!input) {
            console.error(`Input with ID ${id} not found.`);
            return 0;
        }
        return parseFloat(input.value) || 0;
    }
}
const portfolioCalculator = new PortfolioCalculator();
window.onload = function () {
};

//i should probably add and include calculations for overnight positions. if user inputs value
// for overnight, then average price becomes void. or perhaps i can repurpose average price
// and let the user know to only input the previous closing price of the security