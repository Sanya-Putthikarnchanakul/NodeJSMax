const num1 = document.getElementById('num1') as HTMLInputElement;
const num2 = document.getElementById('num2') as HTMLInputElement;

function add(n1: number, n2: number) {
    return n1 + n2;
}

/* Format 1 */
/*const btn = document.querySelector('button');
if (btn) {
    btn.addEventListener('click', () => {
        const result = add(Number(num1.value), Number(num2.value));
    
        console.log(result);
    });
}*/

/* Format 2 */
/*const btn = document.querySelector('button')!;
btn.addEventListener('click', () => {
    const result = add(Number(num1.value), Number(num2.value));

    console.log(result);
});*/

/* Allow any Type */
/*function add(n1: any, n2: number) {
    return n1 + n2;
}*/

/* Union Types */
/*function add(n1: number | string, n2: number | string) {
    if (typeof n1 === 'number' && typeof n2 === 'number') {
        return n1 + n2;
    } else if (typeof n1 == 'string' && typeof n2 === 'string') {
        return `${n1} ${n2}`;
    }

    return +n1 + +n2;
}*/

//#region Function that Accept Object

/*const processObject = (obj: { name: string; age: number; projectIds: number[] }) => {
    console.log(obj);
}

const btn = document.querySelector('button')!;

btn.addEventListener('click', () => {
    const obj = {
        name: 'Sanya P.',
        age: 33,
        projectIds: [ 125,128 ]
    };
    processObject(obj);
});*/

//#endregion

//#region Defining Type + Generic Type

type Employee = { name: string; age: number; projectIds: /*number[]*/ Array<number> };

const processObject = (obj: Employee) => {
    console.log(obj);
}

const btn = document.querySelector('button')!;

btn.addEventListener('click', () => {
    const obj = {
        name: 'Sanya P.',
        age: 33,
        projectIds: [ 125,128 ]
    };

    processObject(obj);
});

//#endregion