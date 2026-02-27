// Mega 6/45 Data
let megaFullSetCount = {};
let megaSixCount = {};
let megaNumberFrequency = {};
let megaDrawHistory = [];

/**
 * Process Mega 6/45 data from JSONL file
 */
function processMegaData(text) {
    const lines = text.trim().split("\n");

    lines.forEach(line => {
        try {
            const data = JSON.parse(line);
            const date = data.date;
            const drawId = data.id;
            const numbers = data.result.map(n => String(n).padStart(2, '0')).sort();

            megaDrawHistory.push({ date, drawId, numbers });

            // Count full sets
            const fullKey = numbers.join("-");
            megaFullSetCount[fullKey] = (megaFullSetCount[fullKey] || 0) + 1;

            // Count individual numbers
            numbers.forEach(num => {
                megaNumberFrequency[num] = (megaNumberFrequency[num] || 0) + 1;
            });

            // Count all pairs and triples
            for (let i = 0; i < numbers.length; i++) {
                for (let j = i + 1; j < numbers.length; j++) {
                    for (let k = j + 1; k < numbers.length; k++) {
                        const six = [numbers[i], numbers[j], numbers[k]].join("-");
                        megaSixCount[six] = (megaSixCount[six] || 0) + 1;
                    }
                }
            }
        } catch (e) {
            // Skip malformed lines
        }
    });

    displayMegaResults();
}

/**
 * Display Mega 6/45 analysis results
 */
function displayMegaResults() {
    let html = "";

    // Random special numbers section
    html += "<div class='random-numbers-container' id='megaRandomSection'>";
    html += "<h3 style='color: #667eea;'>🎲 Số gợi ý</h3>";
    html += createMegaRandomNumbersDisplay();
    html += "</div>";

    // Refresh button
    html += "<div style='text-align:center; margin-top:10px;'>" +
            "<button onclick=\"refreshMegaRandomSuggest()\">🔄 Làm mới số</button>" +
            "</div>";

    // Suggested sets section
    html += "<h2 class='result-heading'>💡 Bộ 6 số chưa từng xuất hiện</h2>";
    html += "<div id='megaSuggestSection'>" + createMegaSuggestTable() + "</div>";

    // Recent results
    const recentDates = getMegaUniqueDates(megaDrawHistory).slice(0, 10);
    html += "<h2 class='result-heading'>📅 Kết quả 10 ngày gần nhất</h2>";
    html += createMegaRecentTable(recentDates);

    // Full sets
    const filteredFull = Object.fromEntries(
        Object.entries(megaFullSetCount)
            .filter(([k, v]) => v > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
    );
    html += "<h2 class='result-heading'>Bộ 6 số xuất hiện > 1 lần</h2>";
    html += createTable(filteredFull);

    // Sixes
    const filteredSix = Object.fromEntries(
        Object.entries(megaSixCount)
            .filter(([k, v]) => v > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
    );
    html += "<h2 class='result-heading'>Top bộ 3 xuất hiện > 1 lần</h2>";
    html += createTable(filteredSix);

    // Frequency
    html += "<h2 class='result-heading'>Tần suất từng số</h2>";
    html += createTable(
        Object.fromEntries(
            Object.entries(megaNumberFrequency)
                .sort((a, b) => b[1] - a[1])
        )
    );

    document.getElementById("megaResult").innerHTML = html;
}

/**
 * Get unique dates from Mega draw history
 */
function getMegaUniqueDates(history) {
    const dateMap = new Map();
    history.forEach(draw => {
        if (!dateMap.has(draw.date)) {
            dateMap.set(draw.date, []);
        }
        dateMap.get(draw.date).push(draw);
    });
    return Array.from(dateMap.keys()).reverse();
}

/**
 * Create recent Mega results table
 */
function createMegaRecentTable(dates) {
    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>Ngày</th><th>Kỳ</th><th>Bộ 6 số</th></tr>";

    dates.forEach(date => {
        const drawsForDate = megaDrawHistory.filter(d => d.date === date);
        drawsForDate.forEach(draw => {
            html += `<tr>
                <td>${draw.date}</td>
                <td>${draw.drawId}</td>
                <td>${draw.numbers.join(" ")}</td>
            </tr>`;
        });
    });

    html += "</table></div>";
    return html;
}

/**
 * Generate Mega random sets that haven't appeared
 */
function generateMegaRandomSets() {
    const existingSets = new Set(Object.keys(megaFullSetCount));
    const suggestedSets = [];
    
    while (suggestedSets.length < 10) {
        const numbers = [];
        
        // Generate 6 random numbers from 1-45
        while (numbers.length < 6) {
            const num = Math.floor(Math.random() * 45) + 1;
            const numStr = String(num).padStart(2, '0');
            if (!numbers.includes(numStr)) {
                numbers.push(numStr);
            }
        }
        
        numbers.sort();
        const setKey = numbers.join("-");
        
        // Only add if this set has never appeared before
        if (!existingSets.has(setKey)) {
            suggestedSets.push(setKey);
        }
    }
    
    return suggestedSets;
}

/**
 * Generate 6 random Mega numbers
 */
function generateMegaRandomNumbers() {
    const randomNumbers = [];
    while (randomNumbers.length < 6) {
        const num = Math.floor(Math.random() * 45) + 1;
        if (!randomNumbers.includes(num)) {
            randomNumbers.push(num);
        }
    }
    return randomNumbers.sort((a, b) => a - b);
}

/**
 * Create display for Mega random numbers
 */
function createMegaRandomNumbersDisplay() {
    const numbers = generateMegaRandomNumbers();
    let html = "<div class='random-numbers-display'>";
    
    numbers.forEach(num => {
        html += `<div class='random-number-box'>${String(num).padStart(2, '0')}</div>`;
    });
    
    html += "</div>";
    return html;
}

/**
 * Refresh Mega random suggestions
 */
function refreshMegaRandomSuggest() {
    const randomSection = document.getElementById('megaRandomSection');
    if (randomSection) {
        randomSection.innerHTML = "<h3 style='color: #667eea;'>🎲 Số gợi ý</h3>" + 
                                   createMegaRandomNumbersDisplay();
    }
    
    const suggestSection = document.getElementById('megaSuggestSection');
    if (suggestSection) {
        suggestSection.innerHTML = createMegaSuggestTable();
    }
}

/**
 * Create Mega suggestion table
 */
function createMegaSuggestTable() {
    const suggestedSets = generateMegaRandomSets();
    
    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>STT</th><th>Chưa xuất hiện</th></tr>";

    suggestedSets.forEach((set, index) => {
        html += `<tr>
            <td>${index + 1}</td>
            <td>${set}</td>
        </tr>`;
    });

    html += "</table></div>";
    return html;
}

/**
 * Check if a Mega set has appeared in history
 */
function checkMegaSet() {
    const input = document.getElementById("megaCheckInput").value.trim();
    if (!input) return;

    let numbers = input.split(/\s+/);

    if (numbers.length < 3 || numbers.length > 6) {
        showMegaResult("⚠️ Nhập từ 3 đến 6 số!", false);
        return;
    }

    numbers = numbers.map(n => String(n).padStart(2, '0')).sort();

    let matchedDraws = [];

    megaDrawHistory.forEach(draw => {
        const containsAll = numbers.every(num =>
            draw.numbers.includes(num)
        );
        if (containsAll) matchedDraws.push(draw);
    });

    if (matchedDraws.length > 0) {
        let html = `
        ✅ Tổ hợp <strong>${numbers.join("-")}</strong> xuất hiện 
        <strong>${matchedDraws.length}</strong> kỳ
        <br><br>
        <div class="table-wrapper">
        <table>
        <tr>
            <th>Ngày</th>
            <th>Kỳ</th>
            <th>Bộ 6 số</th>
        </tr>`;

        matchedDraws.forEach(draw => {
            html += `
            <tr>
                <td>${draw.date}</td>
                <td>${draw.drawId}</td>
                <td>${draw.numbers.join(" ")}</td>
            </tr>`;
        });

        html += "</table></div>";
        showMegaResult(html, true);
    } else {
        showMegaResult(
            `❌ Tổ hợp ${numbers.join("-")} chưa từng xuất hiện`,
            false
        );
    }
}

/**
 * Display Mega result with styling
 */
function showMegaResult(content, success) {
    const box = document.getElementById("megaCheckResult");
    box.style.display = "block";
    box.innerHTML = content;

    if (success) {
        box.style.borderLeft = "6px solid #28a745";
    } else {
        box.style.borderLeft = "6px solid #dc3545";
    }
}
