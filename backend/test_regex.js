const lines = [
    "1 |M3307 D MAASHIE | 28-40 [449.00 | 8.00 8|20000 | PCS [15.00 | 1,972.00",
    "14 |M5510 E MAASHIE | 28-40 [705.00 | 9.00 945500 | PCS [15.00 | 3,480.75",
    "Cotton T-shirt L Red 50 120.50"
];

for (const line of lines) {
    const cleanLine = line.replace(/[|\\[\\]]/g, ' ').replace(/\\s+/g, ' ').trim();
    const parts = cleanLine.split(' ');
    
    let itemName = '';
    let qty = 0;
    let price = 0;

    if (parts.length >= 3) {
        const lastPart = parts[parts.length - 1].replace(/,/g, '');
        if (!isNaN(parseFloat(lastPart))) {
            price = parseFloat(lastPart);
            
            const pcsIndex = parts.findIndex(p => p.toLowerCase() === 'pcs');
            if (pcsIndex !== -1) {
                for (let i = pcsIndex - 1; i >= 1; i--) {
                    if (!isNaN(parseFloat(parts[i])) && parseFloat(parts[i]) < 1000) {
                        qty = parseFloat(parts[i]);
                        break;
                    }
                }
            }
            
            if (qty === 0) {
                 for (let i = parts.length - 2; i >= 1; i--) {
                     if (!isNaN(parseFloat(parts[i]))) {
                         qty = parseFloat(parts[i]);
                         break;
                     }
                 }
            }
            
            let startIndex = /^\\d+$/.test(parts[0]) ? 1 : 0;
            let nameEndIndex = startIndex;
            for (let i = startIndex; i < parts.length - 1; i++) {
                if (parts[i].toLowerCase() === 'pcs' || !isNaN(parseFloat(parts[i]))) {
                     if (parts[i].includes('-')) continue;
                     nameEndIndex = i;
                     break;
                }
                nameEndIndex++;
            }
            if (nameEndIndex === startIndex) nameEndIndex = parts.length - 2;
            itemName = parts.slice(startIndex, nameEndIndex).join(' ').trim();
        }
    }
    
    console.log({itemName, qty, price});
}
