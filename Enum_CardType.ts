enum Enum_CardType {
    Invalid = 0,
    /**单牌 */
    Single = 10,
    /**对子 */
    Pair = 20,
    /**三条 */
    ThreeOfAKind = 30,
    FourOfAKind = 40,
    /**顺子 */
    Straight = 51,
    /**同花 */
    Flush = 52,
    /**夫佬 */
    FullHouse = 53,
    /**四带一 */
    FourWithA = 54,
    /**同花顺 */
    StraightFlush = 55,
    /** 130.一条龙 */
    Dragon = 130,
}
export default Enum_CardType;
