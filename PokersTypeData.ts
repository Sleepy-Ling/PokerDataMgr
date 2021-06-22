import PokerData from "./PokerData";

export default class PokersTypeData {
    public pokersData: Array<PokerData>;
    /**牌型权重 */
    public pokersWeight: number;
    /**牌值权重 */
    public pokersNumWeight: number;
    /**牌颜色权重 */
    public pokersColorWeight: number;
    /**牌型 */
    public pokersType: number;

    public constructor() {
    }
    public initData(type: number, pokersData: Array<PokerData>) {
        this.pokersType = type;
        this.pokersData = pokersData;
    }
    public initWeight(weightJson: any) {
        this.pokersWeight = weightJson.typeWeight;
        this.pokersNumWeight = weightJson.numWeight;
        this.pokersColorWeight = weightJson.colorWeight;
    }

    public clone() {
        let clone = new PokersTypeData();
        clone.pokersData = this.pokersData;
        clone.pokersWeight = this.pokersWeight;
        clone.pokersNumWeight = this.pokersNumWeight;
        clone.pokersColorWeight = this.pokersColorWeight;
        clone.pokersType = this.pokersType;
        return clone;
    }
}
