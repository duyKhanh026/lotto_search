// Mega 6/45 Data
let megaFullSetCount = {};
let megaSixCount = {};
let megaNumberFrequency = {};
let megaDrawHistory = [];
// Filter state for Mega suggestions
let megaFilter = {
    sumMin: null,
    sumMax: null,
    evenCount: null,
    required: [],
    forbidden: []
};

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
                        const six = [numbers[i], numbers[j], numbers[k]].join(" ");
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

        // Suggested sets section with filter button
        html += "<h2 class='result-heading'>💡 Bộ 6 số chưa từng xuất hiện (xếp hạng theo điểm) <button style=\"margin-left:12px; padding:6px 10px; font-size:0.9em;\" onclick=\"openMegaFilterModal()\">🔎 Filter</button></h2>";
        html += "<div id='megaSuggestSection'>" + createMegaSuggestTable() + "</div>";

        // Modal markup (hidden by default)
        html += `
        <div id="megaFilterModal" class="modal-overlay" style="display:none;">
            <div class="modal">
                <h3>Filter Bộ 6 số</h3>
                <div class="input-group" style="flex-direction:column; gap:8px;">
                    <div>
                        <label>Tổng (>=)</label>
                        <input type="number" id="megaSumMin" placeholder="Tổng tối thiểu">
                        <label style="margin-left:8px;">Tổng (<=)</label>
                        <input type="number" id="megaSumMax" placeholder="Tổng tối đa">
                    </div>
                    <div>
                        <label>Số chẵn (bằng)</label>
                        <input type="number" id="megaEvenCount" placeholder="Số lượng số chẵn">
                    </div>
                    <div>
                        <label>Số bắt buộc (cách nhau bởi dấu cách)</label>
                        <input type="text" id="megaRequired" placeholder="ví dụ: 03 15 28">
                    </div>
                    <div>
                        <label>Số cấm (cách nhau bởi dấu cách)</label>
                        <input type="text" id="megaForbidden" placeholder="ví dụ: 04 07">
                    </div>
                </div>
                <div style="text-align:right; margin-top:12px;">
                    <button onclick="closeMegaFilterModal()" style="margin-right:8px;">Hủy</button>
                    <button onclick="applyMegaFilter()">Áp dụng</button>
                </div>
            </div>
        </div>`;

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
    html += createFrequencyTable(megaNumberFrequency);

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
        const setKey = numbers.join(" ");
        
        // Only add if this set has never appeared before
        if (!existingSets.has(setKey)) {
            suggestedSets.push(setKey);
        }
    }
    
    return suggestedSets;
}

/**
 * Generate up to `count` unseen Mega sets that also pass current filter.
 * Tries up to `maxAttempts` to find candidates; returns fewer if impossible.
 */
function generateFilteredMegaRandomSets(count = 10, maxAttempts = 5000) {
    const existingSets = new Set(Object.keys(megaFullSetCount));
    const suggestedSets = [];
    const seen = new Set();

    // Phases of relaxation. We always try to honor `required` first;
    // then progressively relax `forbidden`, `evenCount`, `sum`.
    const phases = [
        { applyForbidden: true, applyEven: true, applySum: true, applyRequired: true },
        { applyForbidden: false, applyEven: true, applySum: true, applyRequired: true },
        { applyForbidden: false, applyEven: false, applySum: true, applyRequired: true },
        { applyForbidden: false, applyEven: false, applySum: false, applyRequired: true },
        // last resort: allow ignoring required (if user provided impossible required list)
        { applyForbidden: false, applyEven: false, applySum: false, applyRequired: false }
    ];

    for (let p = 0; p < phases.length && suggestedSets.length < count; p++) {
        let attempts = 0;
        const opts = phases[p];

        while (suggestedSets.length < count && attempts < maxAttempts) {
            attempts++;
            const numbers = [];
            while (numbers.length < 6) {
                const num = Math.floor(Math.random() * 45) + 1;
                const numStr = String(num).padStart(2, '0');
                if (!numbers.includes(numStr)) numbers.push(numStr);
            }
            numbers.sort();
            const setKey = numbers.join(' ');

            if (existingSets.has(setKey)) continue;
            if (seen.has(setKey)) continue;

            if (!passesWithOptions(setKey, opts)) continue;

            seen.add(setKey);
            suggestedSets.push(setKey);
        }
    }

    return suggestedSets;
}

/**
 * Check set against `megaFilter` but allow selectively ignoring some constraints via `opts`.
 */
function passesWithOptions(setStr, opts) {
    const useForbidden = opts.applyForbidden;
    const useEven = opts.applyEven;
    const useSum = opts.applySum;
    const useRequired = opts.applyRequired;

    // If no filter at all and nothing required, accept
    const hasAny = (megaFilter.sumMin !== null) || (megaFilter.sumMax !== null) || (megaFilter.evenCount !== null) || (megaFilter.required && megaFilter.required.length > 0) || (megaFilter.forbidden && megaFilter.forbidden.length > 0);
    if (!hasAny && useRequired) return true;

    const nums = setStr.split(' ').map(s => parseInt(s, 10));
    const sum = nums.reduce((a, b) => a + b, 0);
    const evenCnt = nums.filter(n => n % 2 === 0).length;

    if (useSum) {
        if (megaFilter.sumMin !== null && sum < megaFilter.sumMin) return false;
        if (megaFilter.sumMax !== null && sum > megaFilter.sumMax) return false;
    }

    if (useEven) {
        if (megaFilter.evenCount !== null && megaFilter.evenCount !== '' && evenCnt !== Number(megaFilter.evenCount)) return false;
    }

    if (useRequired) {
        if (megaFilter.required && megaFilter.required.length > 0) {
            for (let r of megaFilter.required) {
                if (!r) continue;
                const rStr = String(r).padStart(2, '0');
                if (!setStr.split(' ').includes(rStr)) return false;
            }
        }
    }

    if (useForbidden) {
        if (megaFilter.forbidden && megaFilter.forbidden.length > 0) {
            for (let f of megaFilter.forbidden) {
                if (!f) continue;
                const fStr = String(f).padStart(2, '0');
                if (setStr.split(' ').includes(fStr)) return false;
            }
        }
    }

    return true;
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
// calculate score (sum of frequencies) for a given set string
function getMegaSetScore(setStr) {
    const nums = setStr.split(" ");
    let score = 0;
    nums.forEach(num => {
        score += (megaNumberFrequency[num] || 0);
    });
    return score;
}

function createMegaSuggestTable() {
    const suggestedSets = generateFilteredMegaRandomSets(10);

    // compute score for each set and sort by descending score
    const scoredSets = suggestedSets.map(set => ({
        set,
        score: getMegaSetScore(set)
    }));

    scoredSets.sort((a, b) => b.score - a.score);

    let html = "<div class='table-wrapper'><table>";
    html += "<tr><th>STT</th><th>Chưa xuất hiện</th><th>Điểm</th></tr>";

    scoredSets.forEach((item, index) => {
        html += `<tr>
            <td>${index + 1}</td>
            <td>${item.set}</td>
            <td>${item.score}</td>
        </tr>`;
    });

    html += "</table></div>";
    return html;
}

/**
 * Check if a set string passes current megaFilter
 */
function setPassesMegaFilter(setStr) {
    if (!megaFilter) return true;
    // If all filter fields are empty, allow
    const hasAny = (megaFilter.sumMin !== null) || (megaFilter.sumMax !== null) || (megaFilter.evenCount !== null) || (megaFilter.required && megaFilter.required.length > 0) || (megaFilter.forbidden && megaFilter.forbidden.length > 0);
    if (!hasAny) return true;

    const nums = setStr.split(" ").map(s => parseInt(s, 10));
    const sum = nums.reduce((a, b) => a + b, 0);
    const evenCnt = nums.filter(n => n % 2 === 0).length;

    if (megaFilter.sumMin !== null && sum < megaFilter.sumMin) return false;
    if (megaFilter.sumMax !== null && sum > megaFilter.sumMax) return false;
    if (megaFilter.evenCount !== null && megaFilter.evenCount !== '' && evenCnt !== Number(megaFilter.evenCount)) return false;

    if (megaFilter.required && megaFilter.required.length > 0) {
        for (let r of megaFilter.required) {
            if (!r) continue;
            const rStr = String(r).padStart(2, '0');
            if (!setStr.split(' ').includes(rStr)) return false;
        }
    }

    if (megaFilter.forbidden && megaFilter.forbidden.length > 0) {
        for (let f of megaFilter.forbidden) {
            if (!f) continue;
            const fStr = String(f).padStart(2, '0');
            if (setStr.split(' ').includes(fStr)) return false;
        }
    }

    return true;
}

/* Modal handlers */
function openMegaFilterModal() {
    const modal = document.getElementById('megaFilterModal');
    if (!modal) return;
    // populate inputs
    document.getElementById('megaSumMin').value = megaFilter.sumMin !== null ? megaFilter.sumMin : '';
    document.getElementById('megaSumMax').value = megaFilter.sumMax !== null ? megaFilter.sumMax : '';
    document.getElementById('megaEvenCount').value = megaFilter.evenCount !== null ? megaFilter.evenCount : '';
    document.getElementById('megaRequired').value = (megaFilter.required || []).join(' ');
    document.getElementById('megaForbidden').value = (megaFilter.forbidden || []).join(' ');
    modal.style.display = 'block';
}

function closeMegaFilterModal() {
    const modal = document.getElementById('megaFilterModal');
    if (!modal) return;
    modal.style.display = 'none';
}

function applyMegaFilter() {
    // read values
    const sumMinVal = document.getElementById('megaSumMin').value;
    const sumMaxVal = document.getElementById('megaSumMax').value;
    const evenCountVal = document.getElementById('megaEvenCount').value;
    const requiredVal = document.getElementById('megaRequired').value.trim();
    const forbiddenVal = document.getElementById('megaForbidden').value.trim();

    megaFilter.sumMin = sumMinVal !== '' ? Number(sumMinVal) : null;
    megaFilter.sumMax = sumMaxVal !== '' ? Number(sumMaxVal) : null;
    megaFilter.evenCount = evenCountVal !== '' ? Number(evenCountVal) : null;
    megaFilter.required = requiredVal !== '' ? requiredVal.split(/\s+/).map(s => s.padStart ? s.padStart(2, '0') : s) : [];
    megaFilter.forbidden = forbiddenVal !== '' ? forbiddenVal.split(/\s+/).map(s => s.padStart ? s.padStart(2, '0') : s) : [];

    closeMegaFilterModal();
    const suggestSection = document.getElementById('megaSuggestSection');
    if (suggestSection) suggestSection.innerHTML = createMegaSuggestTable();
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
        ✅ Tổ hợp <strong>${numbers.join(" ")}</strong> xuất hiện 
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
            `❌ Tổ hợp ${numbers.join(" ")} chưa từng xuất hiện`,
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
