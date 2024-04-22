const input = {
    "02": "06 17 18 26 43 45 04 12 19 23 36 41 04 17 19 27 28 36",
    "03": "02 10 30 33 34 40 08 14 26 28 43 45 11 15 34 39 41 43",
    "20": "01 14 22 28 32 42 01 15 34 39 41 43 3 10 17 20 22 27",
    "21": "17 21 24 25 39 42 05 19 20 21 24 40 01 10 21 25 32 39",
    "32": "09 15 21 29 33 39 20 22 24 26 28 37 06 29 31 35 42 44",
    "33": "08 09 11 12 40 44 01 03 05 26 30 42 06 17 18 26 43 45"
};

// 02 03 20 21 32 33


function analyzeData(data, number) {
    const arr = data[number].split(" ");
    return arr.sort();
}

function mergeArr(...arrs) {
    // Combine all arrays into a single array
    const combinedArray = [].concat(...arrs);

    return combinedArray;
}

function countOccurrences(numbers) {
    // Create an object to store occurrences (key: string representation of number, value: count)
    const occurrences = {};

    // Count occurrences of each number (handle both numeric and string types)
    numbers.forEach((number) => {
        const key = Number(number); // Convert number to string for consistent keys
        occurrences[key] = (occurrences[key] || 0) + 1;
    });

    // Sort occurrences object directly (no need for array conversion)
    Object.values(occurrences).sort((a, b) => Number(b) - Number(a)); // Sort values (b - a)

    // Return the occurrences object
    return occurrences;
}

const res = mergeArr([
    '04', '04', '06', '12',
    '17', '17', '18', '19',
    '19', '23', '26', '27',
    '28', '36', '36', '41',
    '43', '45'
],
    [
        '02', '08', '10', '11',
        '14', '15', '26', '28',
        '30', '33', '34', '34',
        '39', '40', '41', '43',
        '43', '45'
    ],
    [
        '01', '01', '10', '14',
        '15', '17', '20', '22',
        '22', '27', '28', '3',
        '32', '34', '39', '41',
        '42', '43'
    ],
    [
        '01', '05', '10', '17',
        '19', '20', '21', '21',
        '21', '24', '24', '25',
        '25', '32', '39', '39',
        '40', '42'
    ],
    [
        '06', '09', '15', '20',
        '21', '22', '24', '26',
        '28', '29', '29', '31',
        '33', '35', '37', '39',
        '42', '44'
    ],
    [
        '01', '03', '05', '06',
        '08', '09', '11', '12',
        '17', '18', '26', '26',
        '30', '40', '42', '43',
        '44', '45'
    ]);
// res.sort();

// console.log(countOccurrences(res));
const result = countOccurrences(res);
console.log(result);