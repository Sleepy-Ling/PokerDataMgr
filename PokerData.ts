export default class PokerData {
    public pokersNum: number;//扑克点数
    public pokerIdx: number;//扑克序号
    /**
     * 初始化函数
     * @param idx 扑克序号
     * @param num 扑克点数
     */
    constructor(idx: number, num: number) {
        this.pokerIdx = idx;
        this.pokersNum = num;
    }
}