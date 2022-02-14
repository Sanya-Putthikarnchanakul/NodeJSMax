"use strict";
var num1 = document.getElementById('num1');
var num2 = document.getElementById('num2');
function add(n1, n2) {
    return n1 + n2;
}
var processObject = function (obj) {
    console.log(obj);
};
var btn = document.querySelector('button');
btn.addEventListener('click', function () {
    var obj = {
        name: 'Sanya P.',
        age: 33,
        projectIds: [125, 128]
    };
    processObject(obj);
});
//#endregion
