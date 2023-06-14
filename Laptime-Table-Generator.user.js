// ==UserScript==
// @name         우마무스메 챔미 기록표 제작기
// @namespace    http://tampermonkey.net/
// @version      1.2.4
// @description  우마무스메 레이스 에뮬레이터로 말딸들의 기록표를 만드는 스크립트입니다.
// @author       Ravenclaw5874
// @match        http://race-ko.wf-calc.net/
// @match        http://race.wf-calc.net/
// @icon         https://img1.daumcdn.net/thumb/C151x151/?fname=https%3A%2F%2Ft1.daumcdn.net%2Fcafeattach%2F1ZK1D%2F80ed3bb76fa6ce0a4a0c7a9cc33d55430f797e35
// @grant        none
// @require      http://code.jquery.com/jquery-3.6.1.min.js
// @require      https://raw.githubusercontent.com/evanplaice/jquery-csv/main/src/jquery.csv.js
// @license      MIT License
// ==/UserScript==

/* 업데이트 로그
1.2.4 필터 placeholder 변경
1.2.3 각질을 결과에 추가
1.2.2 풀 스퍼트 평균을 결과에 추가
1.2.1 csv->tsv 변경
1.2 챔미명 안써도 되게 업데이트

1.1 저장된 말딸 일괄 삭제 버튼 추가.

1.0 완성
*/

function simulate() {
    return new Promise(async resolve => {
        //진행도 감시자 설정
        let observer = new MutationObserver(async (mutations) => {

            //시뮬레이션 끝나면
            if(target.ariaValueNow === "100") {
                //감시자 제거
                observer.disconnect();

                let spurtRatio = document.querySelector("#app > div.main-frame > div:nth-child(5) > table:nth-child(4) > tr:nth-child(2) > td:nth-child(1)").innerText;
                let average = document.querySelector("#app > div.main-frame > div:nth-child(5) > table:nth-child(2) > tr:nth-child(2) > td:nth-child(2)").innerText;
                let full_spurt_average = document.querySelector("#app > div.main-frame > div:nth-child(5) > table:nth-child(2) > tr:nth-child(3) > td:nth-child(2)").innerText;
                let fastest = document.querySelector("#app > div.main-frame > div:nth-child(5) > table:nth-child(2) > tr:nth-child(2) > td:nth-child(4)").innerText;

                //전체 진행도 갱신
                //once? currentSimulateCount+=1: currentSimulateCount+=userSimulateCount;
                //updateProgressBar( parseInt(currentSimulateCount/totalSimulateCount*100) );

                //결과값 반환
                let result = [spurtRatio, average, full_spurt_average, fastest];
                resolve(result);
            }
        });

        let target = document.querySelector("#app > div.main-frame > form > div:nth-child(28) > div.el-dialog__wrapper > div > div.el-dialog__body > div");
        let option = { attributes: true };

        //감시자 생성
        observer.observe(target, option);

        //n번 시뮬
        await document.querySelector("#app > div.main-frame > form > div:nth-child(28) > div:nth-child(1) > div > button").click();

        //document.querySelector("body > div.v-modal").remove();
    });
}

var main = async function(CM_name) {
    let result = [];
    //진행도 바 생성을 위한 한번 시뮬
    await document.querySelector("#app > div.main-frame > form > div:nth-child(28) > div:nth-child(3) > div > button").click();

    await document.querySelector("#app > div.main-frame > form > div:nth-child(2) > div > div").click();
    await document.querySelector("#app > div.main-frame > form > div:nth-child(2) > div > div").click();

    let saved_Uma_NodeList_All = document.querySelectorAll("body > div:last-child > div:nth-child(1) > div:nth-child(1) > ul > li.el-select-dropdown__item");
    let saved_Uma_NodeList = [];

    //챔미 필터링
    for (let i = 0; i < saved_Uma_NodeList_All.length; i++) {
        let words = saved_Uma_NodeList_All[i].innerText.split(" ");
        if (words[0] === CM_name || CM_name === '') { //챔미 이름 비워놨으면 전부, 채워놨으면 같은것만
            saved_Uma_NodeList.push(saved_Uma_NodeList_All[i]);
        }
    }

    //필터링된 말딸 시뮬
    for (let i = 0; i < saved_Uma_NodeList.length; i++) {
        let row = {};
        let words = saved_Uma_NodeList[i].innerText.split(" ");
        await saved_Uma_NodeList[i].click();
        await document.querySelector("#app > div.main-frame > form > div:nth-child(3) > div > button").click();//불러오기
        //전체 진행도
        let ratio = document.createTextNode(`(${i+1}/${saved_Uma_NodeList.length})`);
        let progressbar = document.querySelector("#app > div.main-frame > form > div:nth-child(28) > div.el-dialog__wrapper > div > div.el-dialog__body > div");
        let inserted_progess = progressbar.parentNode.insertBefore(ratio, progressbar);

        document.querySelector("#app > div.main-frame > form > div:nth-child(28) > div.el-dialog__wrapper > div > div.el-dialog__body").innerText.replace(".... ", ratio);
        let simulateResults = await simulate();//시뮬

        if (CM_name === '') { //전체 필터링이고
            /*if (words.length === 3) row['챔미'] = words[0]; //레오 수루젠 12345
            else if (words.length === 2) row['챔미'] = ""; //수루젠 12345
            else row['챔미'] = "";*/
            row['필터'] = words[words.length-3];
        }

        //각질 가져오기
        await document.querySelector("#app > div.main-frame > form > div:nth-child(14) > div > div > div").click();
        let dropDownNodes = document.querySelectorAll("body > div.el-select-dropdown.el-popper");
        let strategy_Parent = dropDownNodes[dropDownNodes.length-1].querySelector("div > div > ul"); //각질
        let userSelected_Strategy = strategy_Parent.querySelector("ul > li.selected");

        row['말딸'] = words[words.length-2];
        row['각질'] = userSelected_Strategy.innerText;
        row['평점'] = words[words.length-1];
        row['최대 스퍼트 비율'] = simulateResults[0];
        row['평균 랩타임'] = simulateResults[1];
        row['풀 스퍼트 평균'] = simulateResults[2];
        row['베스트 랩타임'] = simulateResults[3];

        result.push(row);
        progressbar.parentNode.removeChild(inserted_progess);
    }

    function downloadUnicodeCSV(filename, datasource) {
        let link = document.createElement('a');
        link.setAttribute('href', 'data:text/csv;charset=utf-8,%EF%BB%BF' + encodeURIComponent($.csv.fromObjects(datasource)));
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    function downloadDictionaryArrayAsTSV(dictionaryArray, filename) {
        const keys = Object.keys(dictionaryArray[0]);
        const rows = [keys, ...dictionaryArray.map(obj => keys.map(key => obj[key]))];
        const tsv = /*firstLine + */rows.map(row => row.join('\t')).join('\n');
        const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${filename}.tsv`;
        link.href = url;
        link.click();
    }
    let filename = (CM_name === ''? '전체 기록표':`${CM_name}배 전체 기록표`);
    //downloadUnicodeCSV(filename, result);
    downloadDictionaryArrayAsTSV(result, filename)

}

async function deleteSaves(CM_name) {
    //확인 메시지
    let choice = (CM_name === '')?
        confirm(`저장된 말딸들을 모두 삭제합니까?`):
        confirm(`저장된 ${CM_name}배 말딸들을 모두 삭제합니까?`);

    //유저가 취소 선택
    if (choice === false) return;

    //삭제처리
    //저장된 말딸 전부 불러오기
    let savedListButtonNode = document.querySelector("#app > div.main-frame > form > div:nth-child(2) > div > div");
    await savedListButtonNode.click();
    await savedListButtonNode.click();
    let savedUmaList = document.querySelectorAll("body > div.el-select-dropdown.el-popper:last-child > div.el-scrollbar > div:nth-child(1) > ul:nth-child(1) > li.el-select-dropdown__item");
    //console.log(savedUmaList);

    //삭제 버튼
    let deleteButton = document.querySelector("#app > div.main-frame > form > div:nth-child(4) > div > span > span > button");
    await deleteButton.click();
    await deleteButton.click();
    let deleteConfirmButton = document.querySelector("body > div:last-child > div.el-popconfirm > div > button.el-button.el-button--primary.el-button--mini");

    //삭제 횟수 측정용
    let delete_count = 0;

    //전체 삭제
    if (CM_name === '') {
        for (let i=0; i<savedUmaList.length; i++) {
            await savedUmaList[i].click();
            await deleteConfirmButton.click();
            delete_count++;
        }
    }
    //필터 삭제
    else {
        for (let i=0; i<savedUmaList.length; i++) {
            //챔미명과 저장된 챔미명이 다르면 다음 루프로
            let words = savedUmaList[i].innerText.split(" ");
            if (words[0] !== CM_name) continue;

            await savedUmaList[i].click();
            await deleteConfirmButton.click();
            delete_count++;
        }
    }

    //완료 메시지
    alert(`총 ${delete_count}개의 저장된 말딸 정보를 삭제했습니다.`)
}

function createNode() {
    //챔미 이름 필터 칸 생성
    let CM_input = document.querySelector("#app > div.main-frame > form > div:nth-child(8)").cloneNode(true);
    let CM_nameNode = CM_input.querySelector("div > div > input");
    CM_nameNode.setAttribute("placeholder", "필터");
    //CM_input.firstChild.innerText = "배";
    //CM_input.appendChild(CM_input.firstChild.cloneNode(true));
    CM_input.removeChild(CM_input.firstChild);

    //제작 버튼 생성
    let div = document.createElement("div");
    /*
let outerBox = document.createElement("div");
outerBox.setAttribute("class", "el-form-item__content");

let textBox = document.createElement("div");
textBox.setAttribute("class", "input-status el-input");

let innerBox = document.createElement("input");
innerBox.setAttribute("type", "el-input__inner");
innerBox.setAttribute("class", "input-status el-input");
*/
    let button = document.createElement("button");
    button.setAttribute("class", "el-button el-button--success");
    button.innerText = "기록표 제작 시작";
    button.onclick = () => {
        let CM_name = CM_nameNode.value;
        main(CM_name);
    };

    //삭제 버튼 생성
    let del_button = document.querySelector("#app > div.main-frame > form > div:nth-child(4) > div > span > span > button").cloneNode(true);
    del_button.innerText = "저장된 말딸 삭제"
    del_button.onclick = () => {
        let CM_name = CM_nameNode.value;
        deleteSaves(CM_name);
    };


    div.appendChild(CM_input);
    div.appendChild(button);
    div.appendChild(del_button);

    return div;
}

function checkURL() {
    if (location.hash !== '#/champions-meeting') return;
    document.querySelector("#app > div.main-frame > form").appendChild(createNode());
}

checkURL();

