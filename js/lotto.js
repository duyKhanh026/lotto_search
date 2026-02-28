// Lotto 6/36 Data
let fullSetCount = {};
let tripleCount = {};
let numberFrequency = {};
let drawHistory = [];

// Filter state for Lotto suggestions
let lottoFilter = {
    sumMin: null,
    sumMax: null,
    evenCount: null,
    required: [],
    forbidden: []
};

/**
 * Process lotto data from file
 */
function processData(text) {
    const lines = text.trim().split("\n");

    lines.forEach(line => {
        const parts = line.trim().split(" ");
        if (parts.length < 3) return;

        const date = parts[0];
        const drawId = parts[1];
        const numbersPart = parts[2];
        const mainPart = numbersPart.split("|")[0];
        const special = numbersPart.split("|")[1] || "";

        // Extract numbers
        let numbers = [];
        for (let i = 0; i < mainPart.length; i += 2) {
            numbers.push(mainPart.substr(i, 2));
        }
        numbers.sort();

        drawHistory.push({ date, drawId, numbers, special: special });

        // Count full sets
        const fullKey = numbers.join("-");
        fullSetCount[fullKey] = (fullSetCount[fullKey] || 0) + 1;

        // Count individual numbers
        numbers.forEach(num => {
            numberFrequency[num] = (numberFrequency[num] || 0) + 1;
        });

        // Count triples
        for (let i = 0; i < numbers.length; i++) {
            for (let j = i + 1; j < numbers.length; j++) {
                for (let k = j + 1; k < numbers.length; k++) {
                    const triple = [numbers[i], numbers[j], numbers[k]].join(" ");
                    tripleCount[triple] = (tripleCount[triple] || 0) + 1;
                }
            }
        }
    });

    displayResults();
}

/**
 * Display analysis results on lotto page
 */
function displayResults() {
    let html = "";

    // Random special numbers section
    html += "<div class='random-numbers-container' id='randomSection'>";
    html += "<h3 style='color: #667eea;'>🎲 Số đặc biệt</h3>";
    html += createRandomNumbersDisplay();
    html += "</div>";

    // Refresh button
    html += "<div style='text-align:center; margin-top:10px;'>" +
            "<button onclick=\"refreshRandomSuggest()\">🔄 Làm mới số</button>" +
            "</div>";

    // Suggested numbers section with filter button
    html += "<h2 class='result-heading'>💡 Bộ số chưa từng xuất hiện <button style=\"margin-left:12px; padding:6px 10px; font-size:0.9em;\" onclick=\"openLottoFilterModal()\">🔎 Filter</button></h2>";
    html += "<div id='suggestSection'>" + createSuggestTable() + "</div>";

    // Modal markup for filters (hidden by default)
    html += `
        <div id="lottoFilterModal" class="modal-overlay" style="display:none;">
            <div class="modal">
                <h3>Filter Bộ số</h3>
                <div class="input-group" style="flex-direction:column; gap:8px;">
                    <div>
                        <label>Tổng (>=)</label>
                        <input type="number" id="sumMin" placeholder="Tổng tối thiểu">
                        <label style="margin-left:8px;">Tổng (<=)</label>
                        <input type="number" id="sumMax" placeholder="Tổng tối đa">
                    </div>
                    <div>
                        <label>Số chẵn (bằng)</label>
                        <input type="number" id="evenCount" placeholder="Số lượng số chẵn">
                    </div>
                    <div>
                        <label>Số bắt buộc (cách nhau bởi dấu cách)</label>
                        <input type="text" id="required" placeholder="ví dụ: 03 15 28">
                    </div>
                    <div>
                        <label>Số cấm (cách nhau bởi dấu cách)</label>
                        <input type="text" id="forbidden" placeholder="ví dụ: 04 07">
                    </div>
                </div>
                <div style="text-align:right; margin-top:12px;">
                    <button onclick="closeLottoFilterModal()" style="margin-right:8px;">Hủy</button>
                    <button onclick="applyLottoFilter()">Áp dụng</button>
                </div>
            </div>
        </div>`;

    // Recent results
    const recentDates = getUniqueDates(drawHistory).slice(0, 5);
    html += "<h2 class='result-heading'>📅 Kết quả 5 ngày gần nhất</h2>";
    html += createRecentTable(recentDates);

    // Full sets
    const filteredFull = Object.fromEntries(
        Object.entries(fullSetCount)
            .filter(([k, v]) => v > 1)
            .sort((a, b) => b[1] - a[1])
    );
    html += "<h2 class='result-heading'>Bộ 5 số xuất hiện > 1 lần</h2>";
    html += createTable(filteredFull);

    // Triples
    const filteredTriple = Object.fromEntries(
        Object.entries(tripleCount)
            .filter(([k, v]) => v > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
    );
    html += "<h2 class='result-heading'>Top bộ 3 xuất hiện > 1 lần</h2>";
    html += createTable(filteredTriple);

    // Frequency
    html += "<h2 class='result-heading'>Tần suất từng số</h2>";
    html += createFrequencyTable(numberFrequency);

    document.getElementById("result").innerHTML = html;
}

/**
 * Get unique dates from draw history
 */
function getUniqueDates(history) {
    const dateMap = new Map();
    history.forEach(draw => {
        if (!dateMap.has(draw.date)) {
            dateMap.set(draw.date, []);
        }
        dateMap.get(draw.date).push(draw);
    });
    return Array.from(dateMap.keys());
}

/**
 * Create recent results table
 */
function createRecentTable(dates) {
    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>Ngày</th><th>Kỳ</th><th>Bộ số</th></tr>";

    dates.forEach(date => {
        const drawsForDate = drawHistory.filter(d => d.date === date);
        drawsForDate.forEach(draw => {
            html += `<tr>
                <td>${draw.date}</td>
                <td>${draw.drawId}</td>
                <td>${draw.numbers.join(" ")} | ${draw.special || "-"}</td>
            </tr>`;
        });
    });

    html += "</table></div>";
    return html;
}

/**
 * Generate random sets that haven't appeared
 */
function generateRandomSets() {
    const existingSets = new Set(Object.keys(fullSetCount));
    const suggestedSets = [];
    
    while (suggestedSets.length < 10) {
        const numbers = [];
        
        // Generate 5 random numbers from 1-35
        while (numbers.length < 5) {
            const num = Math.floor(Math.random() * 35) + 1;
            const numStr = String(num).padStart(2, '0');
            if (!numbers.includes(numStr)) {
                numbers.push(numStr);
            }
        }
        
        numbers.sort();
        const setKey = numbers.join(" ");
        
        // Only add if this set has never appeared before
        if (!existingSets.has(setKey)) {
            suggestedSets.push(setKey);
        }
    }
    
    return suggestedSets;
}

/**
 * Generate up to `count` unseen Lotto sets that also satisfy current filter.
 * Uses phased relaxation to return something even if constraints are tight.
 */
function generateFilteredRandomSets(count = 10, maxAttempts = 5000) {
    const existingSets = new Set(Object.keys(fullSetCount));
    const suggestedSets = [];
    const seen = new Set();

    const phases = [
        { applyForbidden: true, applyEven: true, applySum: true, applyRequired: true },
        { applyForbidden: false, applyEven: true, applySum: true, applyRequired: true },
        { applyForbidden: false, applyEven: false, applySum: true, applyRequired: true },
        { applyForbidden: false, applyEven: false, applySum: false, applyRequired: true },
        { applyForbidden: false, applyEven: false, applySum: false, applyRequired: false }
    ];

    for (let p = 0; p < phases.length && suggestedSets.length < count; p++) {
        let attempts = 0;
        const opts = phases[p];

        while (suggestedSets.length < count && attempts < maxAttempts) {
            attempts++;
            const numbers = [];
            while (numbers.length < 5) {
                const num = Math.floor(Math.random() * 35) + 1;
                const numStr = String(num).padStart(2, '0');
                if (!numbers.includes(numStr)) numbers.push(numStr);
            }
            numbers.sort();
            const setKey = numbers.join(' ');

            if (existingSets.has(setKey)) continue;
            if (seen.has(setKey)) continue;
            if (!passesWithOptionsLotto(setKey, opts)) continue;

            seen.add(setKey);
            suggestedSets.push(setKey);
        }
    }

    return suggestedSets;
}

/**
 * Determine whether a candidate set passes the current lottoFilter,
 * allowing selective disabling of each constraint according to `opts`.
 */
function passesWithOptionsLotto(setStr, opts) {
    const useForbidden = opts.applyForbidden;
    const useEven = opts.applyEven;
    const useSum = opts.applySum;
    const useRequired = opts.applyRequired;

    const hasAny = (lottoFilter.sumMin !== null) || (lottoFilter.sumMax !== null) ||
        (lottoFilter.evenCount !== null) || (lottoFilter.required && lottoFilter.required.length > 0) ||
        (lottoFilter.forbidden && lottoFilter.forbidden.length > 0);
    if (!hasAny && useRequired) return true;

    const nums = setStr.split(' ').map(s => parseInt(s, 10));
    const sum = nums.reduce((a, b) => a + b, 0);
    const evenCnt = nums.filter(n => n % 2 === 0).length;

    if (useSum) {
        if (lottoFilter.sumMin !== null && sum < lottoFilter.sumMin) return false;
        if (lottoFilter.sumMax !== null && sum > lottoFilter.sumMax) return false;
    }

    if (useEven) {
        if (lottoFilter.evenCount !== null && lottoFilter.evenCount !== '' && evenCnt !== Number(lottoFilter.evenCount)) return false;
    }

    if (useRequired) {
        if (lottoFilter.required && lottoFilter.required.length > 0) {
            for (let r of lottoFilter.required) {
                if (!r) continue;
                const rStr = String(r).padStart(2, '0');
                if (!setStr.split(' ').includes(rStr)) return false;
            }
        }
    }

    if (useForbidden) {
        if (lottoFilter.forbidden && lottoFilter.forbidden.length > 0) {
            for (let f of lottoFilter.forbidden) {
                if (!f) continue;
                const fStr = String(f).padStart(2, '0');
                if (setStr.split(' ').includes(fStr)) return false;
            }
        }
    }

    return true;
}

/**
 * Handlers for filter modal
 */
function openLottoFilterModal() {
    const modal = document.getElementById('lottoFilterModal');
    if (!modal) return;
    document.getElementById('sumMin').value = lottoFilter.sumMin !== null ? lottoFilter.sumMin : '';
    document.getElementById('sumMax').value = lottoFilter.sumMax !== null ? lottoFilter.sumMax : '';
    document.getElementById('evenCount').value = lottoFilter.evenCount !== null ? lottoFilter.evenCount : '';
    document.getElementById('required').value = (lottoFilter.required || []).join(' ');
    document.getElementById('forbidden').value = (lottoFilter.forbidden || []).join(' ');
    modal.style.display = 'block';
}

function closeLottoFilterModal() {
    const modal = document.getElementById('lottoFilterModal');
    if (!modal) return;
    modal.style.display = 'none';
}

function applyLottoFilter() {
    const sumMinVal = document.getElementById('sumMin').value;
    const sumMaxVal = document.getElementById('sumMax').value;
    const evenCountVal = document.getElementById('evenCount').value;
    const requiredVal = document.getElementById('required').value.trim();
    const forbiddenVal = document.getElementById('forbidden').value.trim();

    lottoFilter.sumMin = sumMinVal !== '' ? Number(sumMinVal) : null;
    lottoFilter.sumMax = sumMaxVal !== '' ? Number(sumMaxVal) : null;
    lottoFilter.evenCount = evenCountVal !== '' ? Number(evenCountVal) : null;
    lottoFilter.required = requiredVal !== '' ? requiredVal.split(/\s+/).map(s => s.padStart ? s.padStart(2, '0') : s) : [];
    lottoFilter.forbidden = forbiddenVal !== '' ? forbiddenVal.split(/\s+/).map(s => s.padStart ? s.padStart(2, '0') : s) : [];

    closeLottoFilterModal();
    const suggestSection = document.getElementById('suggestSection');
    if (suggestSection) suggestSection.innerHTML = createSuggestTable();
}

/**
 * Generate 3 random special numbers
 */
function generateRandomNumbers() {
    const randomNumbers = [];
    while (randomNumbers.length < 3) {
        const num = Math.floor(Math.random() * 12) + 1;
        if (!randomNumbers.includes(num)) {
            randomNumbers.push(num);
        }
    }
    return randomNumbers;
}

/**
 * Create display for random numbers
 */
function createRandomNumbersDisplay() {
    const numbers = generateRandomNumbers();
    let html = "<div class='random-numbers-display'>";
    
    numbers.forEach(num => {
        html += `<div class='random-number-box'>${String(num).padStart(2, '0')}</div>`;
    });
    
    html += "</div>";
    return html;
}

/**
 * Refresh random suggestions
 */
function refreshRandomSuggest() {
    const randomSection = document.getElementById('randomSection');
    if (randomSection) {
        randomSection.innerHTML = "<h3 style='color: #667eea;'>🎲 Số đặc biệt</h3>" + 
                                   createRandomNumbersDisplay();
    }
    
    const suggestSection = document.getElementById('suggestSection');
    if (suggestSection) {
        suggestSection.innerHTML = createSuggestTable();
    }
}

/**
 * Create suggestion table
 */
function createSuggestTable() {
    const suggestedSets = generateFilteredRandomSets(10);
    
    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>STT</th><th>Bộ số gợi ý</th></tr>";

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
 * Check if a set has appeared in history
 */
function checkSet() {
    const input = document.getElementById("checkInput").value.trim();
    if (!input) return;

    let numbers = input.split(/\s+/);

    if (numbers.length < 3 || numbers.length > 5) {
        showResult("⚠️ Nhập từ 3 đến 5 số!", false);
        return;
    }

    numbers = numbers.map(n => n.padStart(2, '0')).sort();

    let matchedDraws = [];

    drawHistory.forEach(draw => {
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
            <th>Bộ số</th>
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
        showResult(html, true);
    } else {
        showResult(
            `❌ Tổ hợp ${numbers.join("-")} chưa từng xuất hiện`,
            false
        );
    }
}

/**
 * Display result with styling
 */
function showResult(content, success) {
    const box = document.getElementById("checkResult");
    box.style.display = "block";
    box.innerHTML = content;

    if (success) {
        box.style.borderLeft = "6px solid #28a745";
    } else {
        box.style.borderLeft = "6px solid #dc3545";
    }
}
