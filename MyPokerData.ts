import Dictionary from "../../../../event/Dictionary";
import Enum_CardType from "./Enum_CardType";
import LogUtils from "../../../../utils/LogUtils";
import PokerData from "./PokerData";
import DateUtils from "../../../../utils/DateUtils";
import PokersTypeData from "./PokersTypeData";

export default class MyPokerData {
    private static _instance: MyPokerData;
    public static get instance() {
        if (!this._instance) {
            this._instance = new MyPokerData();
        }
        return this._instance;
    }
    private constructor() {
    }
    /**扑克点数 */
    // private _myPokersNum: Array<number>;
    /**扑克牌数据 */
    private _myPokersData: Array<PokerData>;
    /**用于保持当前扑克牌类型的字典 */
    private _pokersTypeDic: Dictionary<Enum_CardType, Array<PokersTypeData>>;//key:牌型  value:牌序号
    /**保存能打出的扑克牌类型的字典 */
    private _canUsePokersDic: Dictionary<Enum_CardType, Array<PokersTypeData>>;
    private _canUsePokers: Array<PokerData>;
    public initPokers(pokersData: Array<PokerData>) {
        LogUtils.log("当前计算的牌数据：", pokersData);
        this._myPokersData = new Array<PokerData>();
        this._pokersTypeDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
        this._canUsePokersDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
        this._canUsePokers = new Array<PokerData>();
        this._myPokersData.push(...pokersData);
        this._calculatePokerType();
        this._canUsePokersDic.keys.push(...this._pokersTypeDic.keys);
        this._canUsePokersDic.values.push(...this._pokersTypeDic.values);
        this._canUsePokers.push(...this._myPokersData);

        //输出已经算好的牌
        let testPokersTypeDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
        testPokersTypeDic.keys.push(...this._pokersTypeDic.keys);
        testPokersTypeDic.values.push(...this._pokersTypeDic.values);
        let testCanUseDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
        testCanUseDic.keys.push(...this._canUsePokersDic.keys);
        testCanUseDic.values.push(...this._canUsePokersDic.values);
        LogUtils.warning("===================PokersTypeDic", testPokersTypeDic);
        LogUtils.warning("===================PokersTypeCanUseDic", testCanUseDic);

    }
    private _calculatePokerType() {
        LogUtils.log(">>> 开始执行:", DateUtils.getTimeString());
        this._findSingle();
        this._findPair(0, 1, this._myPokersData);//找对子
        //  找三张
        this._findThreeOfAKind(0, 1, 1, this._myPokersData);
        //找顺子,排序要从1开始到13
        let tempPokers = new Array<PokerData>();
        tempPokers.push(...this._myPokersData);
        tempPokers.sort((a, b) => {
            let tempANum = Math.floor(a.pokersNum / 10);
            let tempBNum = Math.floor(b.pokersNum / 10);
            return tempANum - tempBNum;
        });
        for (let i = 0; i < this._myPokersData.length - 4; i++) {
            this._findFlush(i, this._myPokersData);//找同花
        }
        for (let i = 0; i < this._myPokersData.length; i++) {
            this._findStraight(i, tempPokers, null);//找顺子
        }
        // //////////////////////////////
        // //找夫佬
        this._findFullHouse();
        //找四带一
        this._findFourWithA(0, this._myPokersData);
        //找同花顺
        this._findStraightFlush();
        this._findDragon(tempPokers);
        //按照权重从小到大排序
        this._sortPokersDic();
        LogUtils.log(">>> 结束执行:", DateUtils.getTimeString());
    }
    private _findSingle() {
        for (let i = 0; i < this._myPokersData.length; i++) {
            let poker1 = this._myPokersData[i];
            let pairArr = new Array<PokerData>();
            pairArr.push(poker1);
            this._addIntoDic(Enum_CardType.Single, pairArr);
        }
    }
    /**
     * 找对子
     * @param startIdx 开始寻找的序号
     * @param offNum 偏移序号量
     * @param pokersData 扑克牌数组
     */
    private _findPair(startIdx: number, offNum: number, pokersData: Array<PokerData>) {
        let poker1 = pokersData[startIdx];
        let poker2 = pokersData[startIdx + offNum];
        if (poker2 == null || poker1 == null) {
            return;
        }
        let curPokerNum = this._getPokerNum(poker1.pokersNum);
        let nextPokerNum = this._getPokerNum(poker2.pokersNum);
        if (curPokerNum == nextPokerNum) {
            let pairArr = new Array<PokerData>();
            pairArr.push(poker1, poker2);
            this._addIntoDic(Enum_CardType.Pair, pairArr);
            offNum++;
            if (offNum + startIdx >= pokersData.length) {
                offNum = 1;
                startIdx++;
            }
        }
        else {
            startIdx++;
            offNum = 1;
        }
        this._findPair(startIdx, offNum, pokersData);
    }
    /**
     * 找三张
     * @param startIdx 开始寻找的序号
     * @param offNum 第一张牌与第二张牌偏移序号量
     * @param offNum2 第二张牌与第三张牌偏移序号量
     * @param pokersData 扑克牌数组
     */
    private _findThreeOfAKind(startIdx: number, offNum: number, offNum2: number, pokersData: Array<PokerData>) {
        let poker1 = pokersData[startIdx];
        let poker2 = pokersData[startIdx + offNum];
        let poker3 = pokersData[startIdx + offNum + offNum2];
        if (poker2 == null || poker1 == null || poker3 == null) {
            return;
        }
        let curPokerNum = this._getPokerNum(poker1.pokersNum);
        let secondPokerNum = this._getPokerNum(poker2.pokersNum);
        let thirdPokerNum = this._getPokerNum(poker3.pokersNum);
        if (secondPokerNum == null || thirdPokerNum == null) {
            return;
        }
        if (curPokerNum == secondPokerNum && secondPokerNum == thirdPokerNum) {
            let threeKindArr = new Array<PokerData>();
            threeKindArr.push(poker1, poker2, poker3);
            this._addIntoDic(Enum_CardType.ThreeOfAKind, threeKindArr);
            offNum2++;
            if (offNum2 > 2) {
                offNum++;
                offNum2 = 1;
            }
            if (offNum + startIdx + offNum2 >= pokersData.length) {
                startIdx++;
                offNum = 1;
                offNum2 = 1;
            }
        }
        else {
            startIdx++;
            offNum = 1;
            offNum2 = 1;
        }
        this._findThreeOfAKind(startIdx, offNum, offNum2, pokersData);
    }
    /**
     * 找顺子
     * @param startIdx 开始寻找的序号
     * @param pokersData 扑克牌数组
     * @param resultArr 存放暂时结果的数组
     * @param limiteColor 是否限制颜色（如果是，则颜色全部相同不报存结果，排除同花顺情况）
     * @param outResultArr 回调结果数组
     */
    private _findStraight(startIdx: number, pokersData: Array<PokerData>, resultArr?: Array<PokerData>, limiteColor: boolean = true, outResultArr: Array<Array<PokerData>> = null) {
        let poker1 = pokersData[startIdx];
        if (poker1 == null) {
            let newIdx = startIdx % pokersData.length;
            poker1 = pokersData[newIdx];
            // return;
        }
        if (resultArr == null) {
            poker1 = pokersData[startIdx];
            let curPokerNum = this._getPokerNum(poker1.pokersNum);
            if (curPokerNum > 10) {//没有J-K开头的顺子（有则把该if 注释）
                return;
            }
            resultArr = new Array<PokerData>();
            resultArr.push(poker1);
            let newIdx = ++startIdx % pokersData.length;
            let times = pokersData.length - 1;
            while (times > 0) {
                this._findStraight(newIdx, pokersData, resultArr, limiteColor, outResultArr);
                newIdx++;
                times--;
            }
        }
        else {
            let curPokerNum = this._getPokerNum(poker1.pokersNum);
            let resultNum = this._getPokerNum(resultArr[resultArr.length - 1].pokersNum);
            if (curPokerNum - 1 == resultNum || (resultNum == 13 && curPokerNum == 1)) {
                let newResultArr = new Array<PokerData>();
                newResultArr.push(...resultArr);
                newResultArr.push(poker1);
                if (newResultArr.length == 5) {
                    if (limiteColor) {
                        let isFulsh: Enum_CardType;
                        //防止全部颜色一样
                        isFulsh = this._isFlush(newResultArr);
                        if (outResultArr == null) {
                            if (!isFulsh) {
                                this._addIntoDic(Enum_CardType.Straight, newResultArr);
                                LogUtils.log("顺子： ", newResultArr);
                            }
                        }
                        else {
                            outResultArr.push(newResultArr);
                        }
                    }
                    else {
                        if (outResultArr == null) {
                            this._addIntoDic(Enum_CardType.Straight, newResultArr);
                            LogUtils.log("顺子： ", newResultArr);
                        }
                        else {
                            outResultArr.push(newResultArr);
                        }
                    }
                    return;
                }
                else {
                    let nextIdx = startIdx + 1;
                    let times = pokersData.length + nextIdx;
                    for (let i = nextIdx; i < times; i++) {
                        this._findStraight(i, pokersData, newResultArr, limiteColor, outResultArr);
                    }
                }
            }
            else {
                return;
            }
        }
    }
    /**
     * 找同花
     * @param startIdx 开始寻找的序号
     * @param pokersData 扑克牌数组
     * @param resultArr 存放暂时结果的数组
     */
    private _findFlush(startIdx: number, pokersData: Array<PokerData>, resultArr?: Array<PokerData>) {
        let poker1 = pokersData[startIdx];
        if (poker1 == null) {
            return;
        }
        if (resultArr == null) {
            poker1 = pokersData[startIdx];
            resultArr = new Array<PokerData>();
            resultArr.push(poker1);
            for (let i = startIdx + 1; i < pokersData.length; i++) {
                this._findFlush(i, pokersData, resultArr);
            }
        }
        else {
            poker1 = pokersData[startIdx];
            let curPokerColor = this._getPokerColor(poker1.pokersNum);
            let resultColor = this._getPokerColor(resultArr[resultArr.length - 1].pokersNum);
            if (curPokerColor == resultColor) {
                let newResultArr = new Array<PokerData>();
                newResultArr.push(...resultArr);
                newResultArr.push(poker1);
                if (newResultArr.length == 5) {
                    let isStraight: Enum_CardType;
                    //防止顺子
                    isStraight = this._isStraight(newResultArr);
                    if (!isStraight) {
                        this._addIntoDic(Enum_CardType.Flush, newResultArr);
                        LogUtils.log("同花： ", newResultArr);
                    }
                    return;
                }
                else {
                    for (let i = startIdx + 1; i < pokersData.length; i++) {
                        this._findFlush(i, pokersData, newResultArr);
                    }
                }
            }
            else {
                return;
            }
        }
    }
    /**
     * 找夫佬
     */
    private _findFullHouse() {
        let threeKindArr = this._pokersTypeDic.get(Enum_CardType.ThreeOfAKind);
        let pairArr = this._pokersTypeDic.get(Enum_CardType.Pair);
        if (threeKindArr == null || pairArr == null) {
            return;
        }
        if (threeKindArr.length == 0 || pairArr.length == 0) {
            return;
        }
        for (let i = 0; i < threeKindArr.length; i++) {
            for (let j = 0; j < pairArr.length; j++) {
                let resultArr = new Array<PokerData>();
                let data1 = threeKindArr[i].pokersData[0];
                let data2 = pairArr[j].pokersData[0];
                let realNum1 = this._getPokerNum(data1.pokersNum);
                let realNum2 = this._getPokerNum(data2.pokersNum);
                if (realNum1 == realNum2) {
                    continue;
                }
                resultArr.push(...threeKindArr[i].pokersData);
                resultArr.push(...pairArr[j].pokersData);
                LogUtils.log("夫佬：", resultArr);
                this._addIntoDic(Enum_CardType.FullHouse, resultArr);
            }
        }
    }

    private _findFourSame(startIdx: number, pokersData: Array<PokerData>) {
        let pokerData = pokersData[startIdx];
        if (pokersData == null || startIdx >= pokersData.length - 3) {
            return;
        }
        let pokerNum = pokerData.pokersNum;
        let realNum = this._getPokerNum(pokerNum);
        let pokerNum2: number;
        let realNum2: number;
        let sameCount: number = 1;
        for (let i = 1; i < 4; i++) {
            pokerNum2 = pokersData[startIdx + i].pokersNum;
            realNum2 = this._getPokerNum(pokerNum2);
            if (realNum == realNum2) {
                sameCount++;
                if (sameCount >= 4) {
                    break;
                }
            }
        }
        if (sameCount == 4) {
            let resultArr = new Array<PokerData>();
            for (let i = startIdx; i < startIdx + sameCount; i++) {
                resultArr.push(pokersData[i]);
            }
            this._addIntoDic(Enum_CardType.FourOfAKind, resultArr);
            //LogUtils.log("四同：", resultArr);

        }
        startIdx = startIdx + sameCount;
        this._findFourSame(startIdx, pokersData);
    }
    /**
     * 找四带一
     * @param startIdx 开始寻找的序号
     * @param pokersData 扑克牌数组
     */
    private _findFourWithA(startIdx: number, pokersData: Array<PokerData>) {
        this._findFourSame(startIdx, pokersData);
        let fourSame = this._pokersTypeDic.get(Enum_CardType.FourOfAKind);
        if (fourSame == null || fourSame.length == 0) {
            return;
        }
        for (let i = 0; i < fourSame.length; i++) {
            let fourSameStart = fourSame[i].pokersData[0].pokerIdx;
            let fourSameEnd = fourSameStart + 3;
            for (let j = 0; j < pokersData.length; j++) {
                let tData = pokersData[j];
                if (tData.pokerIdx >= fourSameStart && tData.pokerIdx <= fourSameEnd) {
                    continue;
                }
                let resultArr = new Array<PokerData>();
                resultArr.push(...fourSame[i].pokersData);
                resultArr.push(pokersData[j]);
                this._addIntoDic(Enum_CardType.FourWithA, resultArr);
                LogUtils.log("四带一：", resultArr);
            }
        }
    }
    /**
     * 找同花顺
     */
    private _findStraightFlush() {
        let straightArr = new Array<Array<PokerData>>();
        let tempPokers = new Array<PokerData>();
        tempPokers.push(...this._myPokersData);
        tempPokers.sort((a, b) => {
            let tempANum = Math.floor(a.pokersNum / 10);
            let tempBNum = Math.floor(b.pokersNum / 10);
            return tempANum - tempBNum;
        });
        for (let i = 0; i < this._myPokersData.length; i++) {
            this._findStraight(i, tempPokers, null, false, straightArr);
        }
        if (straightArr == null || straightArr.length == 0) {
            return;
        }
        for (let i = 0; i < straightArr.length; i++) {//遍历顺子
            let curStraightData = straightArr[i];
            let isSameColor;
            isSameColor = this._isFlush(curStraightData);
            if (isSameColor) {
                let resultArr = new Array<PokerData>();
                resultArr.push(...curStraightData);
                LogUtils.log("同花顺：", resultArr);
                this._addIntoDic(Enum_CardType.StraightFlush, resultArr);
            }
        }
    }
    /**找龙牌 */
    private _findDragon(pokersData: Array<PokerData>) {
        if (pokersData.length < 13) {
            return;
        }
        let isDragon: boolean = true;
        for (let i = 0; i < pokersData.length - 1; i++) {
            let p1 = pokersData[i];
            let p2 = pokersData[i + 1];
            let realNum1 = this._getPokerNum(p1.pokersNum);
            let realNum2 = this._getPokerNum(p2.pokersNum);
            if (realNum1 + 1 != realNum2) {
                isDragon = false;
                break;
            }
        }
        if (isDragon) {
            let resultArr = new Array<PokerData>();
            resultArr.push(...pokersData);
            this._addIntoDic(Enum_CardType.Dragon, resultArr);
        }
        return isDragon;
    }

    private _addIntoDic(pokerType: Enum_CardType, pokerArr: Array<PokerData>) {
        let valueArr;
        if (this._pokersTypeDic.keys.indexOf(pokerType) == -1) {
            valueArr = new Array<PokersTypeData>();
        }
        else {
            valueArr = this._pokersTypeDic.get(pokerType);
        }
        let pokersType = new PokersTypeData();
        pokersType.initData(pokerType, pokerArr);
        let pokersWeight = this._calcPokersWeight(pokerType, pokerArr);
        pokersType.initWeight(pokersWeight);
        valueArr.push(pokersType);
        this._pokersTypeDic.add(pokerType, valueArr);
    }

    private _getPokerNum(pokerNum: number) {
        let realNum = Math.floor(pokerNum / 10);
        return realNum;

    }
    private _getPokerColor(pokerNum: number) {
        let realColor = pokerNum % 10;
        return realColor;
    }
    /**计算牌型大小 */
    private _calcPokersWeight(pokerType: Enum_CardType, pokerArr: Array<PokerData>) {
        let resWeight = {
            typeWeight: 0,
            numWeight: 0,
            colorWeight: 0
        }
        /** 牌型权重*/
        let weight = 0;
        let totalNumWeight = 0;
        let totalColorWeight = 0;

        let colorWeight = 0;
        let numWeight = 0;
        switch (pokerType) {
            case Enum_CardType.Single:
            case Enum_CardType.Pair:
            case Enum_CardType.ThreeOfAKind:
                for (let i = 0; i < pokerArr.length; i++) {
                    let pokersNum = pokerArr[i].pokersNum;
                    let realNum = this._getPokerNum(pokersNum);
                    let realColor = this._getPokerColor(pokersNum);
                    if (realNum == 2 || realNum == 1) {
                        realNum += 13;
                    }
                    let numWeight = realNum;
                    totalNumWeight += numWeight;
                    let colorWeight = realColor == 4 ? realColor * 10 : realColor;
                    totalColorWeight += colorWeight;
                }
                break;
            case Enum_CardType.Straight:
                weight = 1000;
                //////蛇
                for (let i = 0; i < pokerArr.length; i++) {
                    let pokersNum = pokerArr[i].pokersNum;
                    let realNum = this._getPokerNum(pokersNum);
                    let realColor = this._getPokerColor(pokersNum);
                    if (realNum == 2 || realNum == 1) {
                        realNum = realNum * 100;
                    }
                    let numWeight = realNum;
                    totalNumWeight += numWeight;
                    //let colorWeight = realColor * 100 * ((i + 1) / pokerArr.length);
                    let colorWeight = realColor;
                    if (i == pokerArr.length - 1) {
                        colorWeight *= 1000;
                    }
                    else {
                        colorWeight = realColor * 10 * ((i + 1) / pokerArr.length);
                    }
                    totalColorWeight += colorWeight;
                }
                //totalColorWeight = this._getPokerColor(pokerArr[pokerArr.length - 1].pokersNum);
                ///////
                break;
            case Enum_CardType.Flush:
                weight = 2000;
                let maxNumWeight = 0;
                colorWeight = this._getPokerColor(pokerArr[0].pokersNum);
                for (let i = 0; i < pokerArr.length; i++) {
                    let pokersNum = pokerArr[i].pokersNum;
                    let realNum = this._getPokerNum(pokersNum);
                    if (realNum == 2 || realNum == 1) {
                        realNum += 13;
                    }
                    if (realNum > maxNumWeight) {
                        maxNumWeight = realNum;
                    }
                }
                totalNumWeight = maxNumWeight * 10;
                totalColorWeight = colorWeight;
                break;
            case Enum_CardType.FullHouse:
                weight = 3000;
                for (let i = 0; i < 3; i++) {
                    let pokersNum = pokerArr[i].pokersNum;
                    let realNum = this._getPokerNum(pokersNum);
                    let realColor = this._getPokerColor(pokersNum);
                    if (realNum == 2 || realNum == 1) {
                        realNum += 13;
                    }
                    let numWeight = realNum * 100;
                    let colorWeight = realColor * 100;
                    totalNumWeight += numWeight;
                    totalColorWeight += colorWeight;
                }
                for (let i = 3; i < 5; i++) {
                    let pokersNum = pokerArr[i].pokersNum;
                    let realNum = this._getPokerNum(pokersNum);
                    let realColor = this._getPokerColor(pokersNum);
                    if (realNum == 2 || realNum == 1) {
                        realNum += 13;
                    }
                    let numWeight = realNum;
                    let colorWeight = realColor == 4 ? realColor * 10 : realColor;
                    totalNumWeight += numWeight;
                    totalColorWeight += colorWeight;
                }
                break;
            case Enum_CardType.FourWithA:
                weight = 4000;
                let pokersNum = pokerArr[0].pokersNum;
                let realNum = this._getPokerNum(pokersNum);
                let realColor = this._getPokerColor(pokersNum);
                if (realNum == 2 || realNum == 1) {
                    realNum += 13;
                }
                numWeight = realNum * 1000;
                pokersNum = pokerArr[4].pokersNum;
                realNum = this._getPokerNum(pokersNum);
                realColor = this._getPokerColor(pokersNum);
                if (realNum == 2 || realNum == 1) {
                    realNum += 13;
                }
                numWeight += realNum;
                colorWeight = realColor;
                totalNumWeight = numWeight;
                totalColorWeight = colorWeight;
                break;
            case Enum_CardType.StraightFlush:
                weight = 5000;
                for (let i = 0; i < pokerArr.length; i++) {
                    let pokersNum = pokerArr[i].pokersNum;
                    let realNum = this._getPokerNum(pokersNum);
                    if (realNum == 2 || realNum == 1) {
                        realNum = realNum * 100;
                    }
                    totalNumWeight += realNum;
                }
                colorWeight = this._getPokerColor(pokerArr[0].pokersNum);
                totalColorWeight = colorWeight;
                break;
            case Enum_CardType.Dragon:
                weight = 6000;
                break;
        }

        resWeight.numWeight = totalNumWeight;
        resWeight.colorWeight = totalColorWeight;
        resWeight.typeWeight = weight;
        return resWeight;
    }
    public calcPokersWeight(pokerType: Enum_CardType, pokerArr: Array<PokerData>) {
        return this._calcPokersWeight(pokerType, pokerArr);
    }
    /**获取牌型数据（从算好的牌型中） */
    public getPokersData(pokerType: number, index: number) {
        let dataArr = this._pokersTypeDic.get(pokerType);
        if (!dataArr || dataArr.length == 0) {
            return null;
        }
        let pokerData = dataArr[index];
        return pokerData;
    }
    /**获取牌型数据（从算好且可以满足打出条件的牌型中） */
    public getCanUsePokersTypeData(pokerType: number, index: number) {
        let dataArr = this._canUsePokersDic.get(pokerType);
        if (!dataArr || dataArr.length == 0) {
            return null;
        }
        let pokerData = dataArr[index];
        return pokerData;
    }
    /**获取能使用的牌的数据 */
    public getCanUsePokersData() {
        let result = new Array<PokerData>();
        result.push(...this._canUsePokers);
        return result;
    }
    /**
     * 更新可以打出牌型数据（根据当前牌的点数、与后端对应）
     * @param pokersNum (方块3：31)
     */
    public updateCanUsePokersDataByNum(pokersNum: number) {
        this._canUsePokersDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
        this._canUsePokers = new Array<PokerData>();
        for (let type of this._pokersTypeDic.keys) {
            let resultTypeData = new Array<PokersTypeData>();
            let tempTypeData = this._pokersTypeDic.get(type);
            if (tempTypeData && tempTypeData.length > 0) {
                tempTypeData.forEach((tpData) => {//遍历每个牌型数据
                    let isContain: boolean = false;
                    let resultPokerData = new Array<PokerData>();
                    resultPokerData.push(...this._canUsePokers);
                    for (let pData of tpData.pokersData) {
                        if (pData.pokersNum == pokersNum) {
                            isContain = true;
                        }
                        if (resultPokerData.indexOf(pData) == -1) {//暂时存储单个数据 类型：pokerData（如果该牌型不存在需要的牌点数，则不要该数组）
                            resultPokerData.push(pData);
                        }
                    }
                    if (isContain) {
                        this._canUsePokers = resultPokerData;
                        resultTypeData.push(tpData);
                    }
                });
            }
            if (resultTypeData && resultTypeData.length > 0) {//存储一系列的牌型数据 类型：PokersTypeData[]
                this._canUsePokersDic.add(type, resultTypeData);
            }
        }
    }
    // /**
    //  * 更新可以打出牌型数据（根据当前牌类型）
    //  */
    // public updateCanUsePokersDataByType(pokerType: Enum_CardType) {
    //     let pokersTypeData = this._pokersTypeDic.get(pokerType);
    //     if (pokersTypeData == null || pokersTypeData.length == 0) {
    //         return;
    //     }
    //     this._canUsePokersDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
    //     this._canUsePokers = new Array<PokerData>();
    //     for (let data of pokersTypeData) {
    //         data.pokersData.forEach((pData) => {
    //             if (this._canUsePokers.indexOf(pData) == -1) {
    //                 this._canUsePokers.push(pData);
    //             }
    //         });
    //     }
    //     this._canUsePokersDic.add(pokerType, pokersTypeData);
    // }
    /**
     * 更新可以打出牌型数据（根据当前打出牌的数量）
     */
    public updateCanUsePokersDataByPokersCount(pokerCount: number) {
        this._canUsePokersDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
        this._canUsePokers = new Array<PokerData>();
        for (let key of this._pokersTypeDic.keys) {
            if (this._getPokerCountByType(key) != pokerCount) {
                continue;
            }
            let resultPokerData = new Array<PokerData>();
            let pokersTypeData = this._pokersTypeDic.get(key);
            if (pokersTypeData == null || pokersTypeData.length == 0) {
                return;
            }
            for (let data of pokersTypeData) {
                data.pokersData.forEach((pData) => {
                    if (resultPokerData.indexOf(pData) == -1) {
                        resultPokerData.push(pData);
                    }
                });
            }
            if (resultPokerData.length > 0) {
                this._canUsePokersDic.add(key, pokersTypeData);
            }
        }
    }
    /**
     * 更新可以打出牌型数据
     * @param targetPokerData 后端牌数据
     */
    public updateCanUsePokersData(targetPokerData: Array<number>) {
        let newTarPokerData = new Array<PokerData>();
        for (let i = 0; i < targetPokerData.length; i++) {
            let pData = new PokerData(0, targetPokerData[i]);
            newTarPokerData.push(pData);
        }
        let targerPokerCount = targetPokerData.length;//后端牌数
        let pokerData = this.checkPokerType(newTarPokerData);
        let pokerWeight = this._calcPokersWeight(pokerData.type, pokerData.pokersData);
        let targetPoker = new PokersTypeData();
        targetPoker.initData(pokerData.type, pokerData.pokersData);
        targetPoker.initWeight(pokerWeight);
        this._canUsePokersDic = new Dictionary<Enum_CardType, Array<PokersTypeData>>();
        this._canUsePokers = new Array<PokerData>();
        let resultTypeData = new Array<PokersTypeData>();
        LogUtils.log("后端数据pokersType   ", targetPoker.pokersType);
        LogUtils.log("后端数据   ", targetPoker);
        for (let key of this._pokersTypeDic.keys) {
            if (key == Enum_CardType.Dragon) {
                resultTypeData = new Array<PokersTypeData>();
                resultTypeData = this._pokersTypeDic.get(key);
                this._canUsePokersDic.add(key, resultTypeData);
                this._canUsePokers.push(...resultTypeData[0].pokersData);
            }
            if (this._getPokerCountByType(key) != targerPokerCount) {
                continue;
            }
            resultTypeData = new Array<PokersTypeData>();
            let typeWeight = this._getTypeWeight(key);
            if (typeWeight > pokerWeight.typeWeight) {//如果当前牌型大于目标牌型则保存当前牌
                let value = this._pokersTypeDic.get(key);
                //把能用的牌型组合记录到字典
                this._canUsePokersDic.add(key, value);
                for (let tempTypeData of value) {
                    //把能用的手牌记录到数据
                    tempTypeData.pokersData.forEach((pData) => {
                        if (this._canUsePokers.indexOf(pData) == -1) {
                            this._canUsePokers.push(pData);
                        }
                    }, this);
                }
            }
            else if (typeWeight == pokerWeight.typeWeight) {//如果当前牌型等于目标牌型
                let value = this._pokersTypeDic.get(key);
                for (let tempTypeData of value) {//则在相应的牌型寻找比目标牌型大的牌，并且保存
                    if (this._comparePokers(tempTypeData, targetPoker)) {
                        resultTypeData.push(tempTypeData);
                        //把能用的手牌记录到数据
                        tempTypeData.pokersData.forEach((pData) => {
                            if (this._canUsePokers.indexOf(pData) == -1) {
                                this._canUsePokers.push(pData);
                            }
                        }, this);
                    }
                }
                if (resultTypeData.length > 0) {
                    //把能用的牌型组合记录到字典
                    this._canUsePokersDic.add(key, resultTypeData);
                }
            }
        }
    }
    /**
     * 检测指定位置的牌点数是否全部相同
     * @param startIdx 开始寻找序号
     * @param endIdx 最后寻找序号
     * @param pokersData 扑克数据
     */
    private _isAllSameNum(startIdx: number, endIdx: number, pokersData: Array<PokerData>) {
        let curPoker = pokersData[startIdx];
        let curPokerNum = this._getPokerNum(curPoker.pokersNum);
        let nextPoker;
        let nextPokerNum;
        for (let i = startIdx + 1; i <= endIdx; i++) {
            nextPoker = pokersData[i];
            nextPokerNum = this._getPokerNum(nextPoker.pokersNum);
            if (curPokerNum != nextPokerNum) {
                LogUtils.log("same => null");
                return null;
            }
        }
        let len = endIdx - startIdx + 1;
        switch (len) {
            case 2:
                return Enum_CardType.Pair;
            case 3:
                return Enum_CardType.ThreeOfAKind;
            case 4:
                return Enum_CardType.FourOfAKind;
            default:
                return null;
        }
    }

    private _isStraight(pokersData: Array<PokerData>) {
        let tempPokerArr: Array<PokerData> = [];
        tempPokerArr.push(...pokersData);
        let firstRealNum = this._getPokerNum(tempPokerArr[0].pokersNum);
        if (firstRealNum != 10) {//如果不是10开头的顺子，需要从小到到大排序
            tempPokerArr.sort((p1, p2) => {
                let p1Num = this._getPokerNum(p1.pokersNum);
                let p2Num = this._getPokerNum(p2.pokersNum);
                return p1Num - p2Num;
            });
        }
        let curPoker;
        let curPokerNum;
        let nextPoker;
        let nextPokerNum;
        for (let i = 0; i < tempPokerArr.length - 1; i++) {
            curPoker = tempPokerArr[i];
            nextPoker = tempPokerArr[i + 1];
            curPokerNum = this._getPokerNum(curPoker.pokersNum);
            nextPokerNum = this._getPokerNum(nextPoker.pokersNum);
            curPokerNum = curPokerNum % 13;
            if (curPokerNum + 1 != nextPokerNum) {
                return null;
            }
        }
        return Enum_CardType.Straight;

    }
    private _isFlush(pokersData: Array<PokerData>) {
        let curPoker = pokersData[0];
        let curPokerColor = this._getPokerColor(curPoker.pokersNum);
        let nextPoker;
        let nextPokerColor;
        for (let i = 1; i < pokersData.length; i++) {
            nextPoker = pokersData[i];
            nextPokerColor = this._getPokerColor(nextPoker.pokersNum);
            if (curPokerColor != nextPokerColor) {
                return null;
            }
        }
        return Enum_CardType.Flush;
    }
    /**
     * 是否夫佬
     * @param pokersData 扑克数据
     * @param type 1：3-2  2：2-3 牌序
     */
    private _isFullHouse(pokersData: Array<PokerData>, type?: Array<number>) {
        if (this._isAllSameNum(0, 2, pokersData) != null && this._isAllSameNum(3, 4, pokersData) != null) {
            type.push(1);
            return Enum_CardType.FullHouse;
        }
        else if (this._isAllSameNum(0, 1, pokersData) != null && this._isAllSameNum(2, 4, pokersData) != null) {
            type.push(2);
            return Enum_CardType.FullHouse;
        }
        return null;
    }
    /**
      * 是否四带一
      * @param pokersData 扑克数据
      * @param type 1：4-1  2：1-4 牌序
      */
    private _isFourWithA(pokersData: Array<PokerData>, type?: Array<number>) {
        if (this._isAllSameNum(0, 3, pokersData) != null && pokersData.length == 5) {
            type.push(1);
            return Enum_CardType.FourWithA;
        }
        else if (this._isAllSameNum(1, 4, pokersData) != null && pokersData.length == 5) {
            type.push(2);
            return Enum_CardType.FourWithA;
        }
        return null;
    }
    /**是否同花顺 */
    private _isStraightFlush(pokersData: Array<PokerData>) {
        if (this._isFlush(pokersData) && this._isStraight(pokersData)) {
            return Enum_CardType.StraightFlush;
        }
        return null;
    }
    /**是否龙牌 */
    private _isDragon(pokersData: Array<PokerData>) {
        let tempPokersData: Array<PokerData> = [];
        tempPokersData.push(...pokersData);
        tempPokersData.sort((a, b) => {
            let realNum1 = this._getPokerNum(a.pokersNum);
            let realNum2 = this._getPokerNum(b.pokersNum);
            return realNum1 - realNum2;
        });
        if (pokersData.length == 13 && this._isStraight(tempPokersData)) {
            return Enum_CardType.Dragon;
        }
        return null;
    }

    /**根据牌型大小权重对比(是否p1比p2大) */
    private _comparePokers(p1: PokersTypeData, p2: PokersTypeData) {
        if (p1.pokersWeight > p2.pokersWeight) {
            return true;
        }
        else if (p1.pokersWeight == p2.pokersWeight) {
            if (p1.pokersNumWeight > p2.pokersNumWeight) {
                return true;
            }
            else if (p1.pokersNumWeight == p2.pokersNumWeight) {
                if (p1.pokersColorWeight > p2.pokersColorWeight) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 检测牌型并且调整牌序
     * @param pokersData 扑克数据
     */
    public checkPokerType(pokersData: Array<PokerData>): { type: Enum_CardType, pokersData: Array<PokerData> } {
        let result = {
            type: null,
            pokersData: []
        }
        let pokerType;
        let callBackType: Array<number> = new Array<number>();
        if (pokersData.length == 1) {
            pokerType = Enum_CardType.Single;
        }
        else if (pokersData.length < 4 && pokersData.length > 1) {
            pokerType = this._isAllSameNum(0, pokersData.length - 1, pokersData);
        }
        else if (pokersData.length == 5) {
            for (let i = 1; i <= 5; i++) {
                pokerType = this._checkAllPokerType(i, pokersData, callBackType);
                if (pokerType) {
                    break;
                }
            }
            if (pokerType == Enum_CardType.Straight || pokerType == Enum_CardType.StraightFlush) {
                let newPokersData = new Array<PokerData>();
                newPokersData.push(...pokersData);
                /////特殊处理-> 10-j-q-k-1  其他按从小到大排序///
                if (this._getPokerNum(pokersData[0].pokersNum) != 10) {
                    newPokersData.sort((a, b) => {
                        let tempANum = this._getPokerNum(a.pokersNum);
                        let tempBNum = this._getPokerNum(b.pokersNum);
                        return tempANum - tempBNum;
                    });
                }
                if (this._getPokerNum(pokersData[0].pokersNum) > 10) {
                    pokerType = null;
                }
                pokersData = newPokersData;
            }
            if (pokerType == Enum_CardType.FullHouse) {
                let detailType = callBackType.pop();
                if (detailType == 2) {
                    let newPokersData = new Array<PokerData>();
                    let curIdx = 2;
                    let times = 5;
                    while (times > 0) {
                        newPokersData.push(pokersData[curIdx]);
                        curIdx = ++curIdx % 5;
                        times--;
                    }
                    pokersData = newPokersData;
                }
            }
            else if (pokerType == Enum_CardType.FourWithA) {
                let detailType = callBackType.pop();
                if (detailType == 2) {
                    let newPokersData = new Array<PokerData>();
                    let curIdx = 1;
                    let times = 5;
                    while (times > 0) {
                        newPokersData.push(pokersData[curIdx]);
                        curIdx = ++curIdx % 5;
                        times--;
                    }
                    pokersData = newPokersData;
                }
            }
        }
        else if (pokersData.length == 13) {
            pokerType = this._checkAllPokerType(0, pokersData, callBackType);
            if (pokerType == Enum_CardType.Dragon) {
                let newPokersData = new Array<PokerData>();
                newPokersData.push(...pokersData);
                newPokersData.sort((a, b) => {
                    let tempANum = this._getPokerNum(a.pokersNum);
                    let tempBNum = this._getPokerNum(b.pokersNum);
                    return tempANum - tempBNum;
                });
                pokersData = newPokersData;
            }
        }
        result.type = pokerType;
        result.pokersData = pokerType == null ? null : pokersData;
        return result;
    }
    /**判断是什么类型的牌型 */
    private _checkAllPokerType(id: number, pokersData: Array<PokerData>, callBackType?: Array<number>) {
        switch (id) {
            case 0:
                return this._isDragon(pokersData);
            case 1:
                return this._isStraightFlush(pokersData);
            case 2:
                return this._isFourWithA(pokersData, callBackType);
            case 3:
                return this._isFullHouse(pokersData, callBackType);
            case 4:
                return this._isFlush(pokersData);
            case 5:
                return this._isStraight(pokersData);
        }
    }
    /**根据牌型得出对应的牌型权重 */
    private _getTypeWeight(type: Enum_CardType) {
        switch (type) {
            case Enum_CardType.Single:
            case Enum_CardType.Pair:
            case Enum_CardType.ThreeOfAKind:
                return 0;
            case Enum_CardType.Straight:
                return 1000;
            case Enum_CardType.Flush:
                return 2000;
            case Enum_CardType.FullHouse:
                return 3000;
            case Enum_CardType.FourWithA:
                return 4000;
            case Enum_CardType.StraightFlush:
                return 5000;
            case Enum_CardType.Dragon:
                return 6000;
        }
        return null;
    }
    /**
     * 根据牌型获得对应的牌数
     * @param type 牌型
     */
    private _getPokerCountByType(type: Enum_CardType) {
        switch (type) {
            case Enum_CardType.Single:
                return 1;
            case Enum_CardType.Pair:
                return 2;
            case Enum_CardType.ThreeOfAKind:
                return 3;
            case Enum_CardType.Straight:
                return 5;
            case Enum_CardType.Flush:
                return 5;
            case Enum_CardType.FullHouse:
                return 5;
            case Enum_CardType.FourWithA:
                return 5;
            case Enum_CardType.StraightFlush:
                return 5;
            case Enum_CardType.Dragon:
                return 13;
        }
    }
    /**
     * 根据牌数获得对应的牌型
     * @param count 牌数
     */
    private _getPokerTypeByCount(count: number) {
        let resultType: Enum_CardType[] = [];
        switch (count) {
            case 1:
                resultType.push(Enum_CardType.Single);
                break;
            case 2:
                resultType.push(Enum_CardType.Pair);
                break;
            case 3:
                resultType.push(Enum_CardType.ThreeOfAKind);
                break;
            case 5:
                resultType.push(Enum_CardType.Straight,
                    Enum_CardType.Flush,
                    Enum_CardType.FullHouse,
                    Enum_CardType.FourWithA,
                    Enum_CardType.StraightFlush
                );
                break;
            case 13:
                resultType.push(Enum_CardType.Dragon)
                break
        }
        return resultType;
    }
    /**
     * 从可用牌库判断当前牌是否可以打出
     * @param pDataType 当前牌型
     * @param pData 当前牌数据
     */
    public isContainPokersData(pDataType: Enum_CardType, pData: PokerData[]) {
        let pokersCount = pData.length;
        let checkType = this._getPokerTypeByCount(pokersCount);
        for (let tempType of checkType) {
            let tempTypeData = this._canUsePokersDic.get(tempType);
            if (tempTypeData == null || tempTypeData.length == 0) {
                continue;
            }
            let curPokerTypeWeight = this._calcPokersWeight(pDataType, pData);
            for (let tpData of tempTypeData) {
                if (tpData.pokersNumWeight == curPokerTypeWeight.numWeight &&
                    tpData.pokersColorWeight == curPokerTypeWeight.colorWeight &&
                    tpData.pokersWeight == curPokerTypeWeight.typeWeight) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * 获得可以打出的牌型数量
     * @param pokerType 具体牌型（Enum_CardType）
     */
    public getCanUseTypeCountByPokerType(pokerType: Enum_CardType) {
        let canUseType = this._canUsePokersDic.get(pokerType);
        if (canUseType) {
            return canUseType.length;
        }
    }
    /**将牌型从小到大排序 */
    private _sortPokersDic() {
        for (let tempTypeData of this._pokersTypeDic.values) {
            tempTypeData.sort((p1, p2) => {
                if (this._comparePokers(p1, p2)) {
                    return 1;
                }
                else {
                    return -1;
                }
            })
        }
    }
    public static release() {
        if (this._instance) {
            this._instance._canUsePokersDic.clear();
            this._instance._pokersTypeDic.clear();
            this._instance = null;
        }
    }
}

