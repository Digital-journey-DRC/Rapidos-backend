export var ProductCategory;
(function (ProductCategory) {
    ProductCategory["ELECTRONICS"] = "electronics";
    ProductCategory["FASHION"] = "fashion";
    ProductCategory["HOME"] = "home";
    ProductCategory["BEAUTY"] = "beauty";
    ProductCategory["SPORTS"] = "sports";
    ProductCategory["TOYS"] = "toys";
    ProductCategory["BOOKS"] = "books";
    ProductCategory["GARDEN"] = "garden";
    ProductCategory["AUTOMOTIVE"] = "automotive";
    ProductCategory["HEALTH"] = "health";
    ProductCategory["PET_SUPPLIES"] = "pet_supplies";
    ProductCategory["MUSIC"] = "music";
    ProductCategory["MOVIES"] = "movies";
    ProductCategory["GAMES"] = "games";
    ProductCategory["OFFICE"] = "office";
    ProductCategory["GROCERIES"] = "groceries";
    ProductCategory["TRAVEL"] = "travel";
    ProductCategory["KITCHEN"] = "kitchen";
    ProductCategory["BABY"] = "baby";
    ProductCategory["STATIONERY"] = "stationery";
    ProductCategory["FURNITURE"] = "furniture";
    ProductCategory["ART"] = "art";
    ProductCategory["HANDMADE"] = "handmade";
    ProductCategory["SOFTWARE"] = "software";
    ProductCategory["VIDEO_GAMES"] = "video_games";
    ProductCategory["FITNESS"] = "fitness";
    ProductCategory["OUTDOORS"] = "outdoors";
    ProductCategory["CLOTHING"] = "clothing";
    ProductCategory["FOOTWEAR"] = "footwear";
    ProductCategory["ACCESSORIES"] = "accessories";
    ProductCategory["JEWELRY"] = "jewelry";
    ProductCategory["WATCHES"] = "watches";
    ProductCategory["BAGS"] = "bags";
    ProductCategory["SUNGLASSES"] = "sunglasses";
    ProductCategory["BELTS"] = "belts";
    ProductCategory["SCARVES"] = "scarves";
    ProductCategory["HATS"] = "hats";
    ProductCategory["SOCKS"] = "socks";
    ProductCategory["UNDERWEAR"] = "underwear";
    ProductCategory["SWIMWEAR"] = "swimwear";
    ProductCategory["ACTIVEWEAR"] = "activewear";
    ProductCategory["LOUNGEWEAR"] = "loungewear";
    ProductCategory["ATHLETICWEAR"] = "athleticwear";
    ProductCategory["CASUALWEAR"] = "casualwear";
    ProductCategory["FORMALWEAR"] = "formalwear";
    ProductCategory["OUTERWEAR"] = "outerwear";
    ProductCategory["COATS"] = "coats";
    ProductCategory["JACKETS"] = "jackets";
    ProductCategory["PARKAS"] = "parkas";
    ProductCategory["VESTS"] = "vests";
    ProductCategory["RAINCOATS"] = "raincoats";
    ProductCategory["BOMBERS"] = "bombers";
    ProductCategory["BLAZERS"] = "blazers";
    ProductCategory["CARDIGANS"] = "cardigans";
})(ProductCategory || (ProductCategory = {}));
export const ProductCategoryLabels = {
    [ProductCategory.ELECTRONICS]: 'électronique',
    [ProductCategory.FASHION]: 'mode',
    [ProductCategory.HOME]: 'maison',
    [ProductCategory.BEAUTY]: 'beauté',
    [ProductCategory.SPORTS]: 'sports',
    [ProductCategory.TOYS]: 'jouets',
    [ProductCategory.BOOKS]: 'livres',
    [ProductCategory.GARDEN]: 'jardin',
    [ProductCategory.AUTOMOTIVE]: 'automobile',
    [ProductCategory.HEALTH]: 'santé',
    [ProductCategory.PET_SUPPLIES]: 'animaux',
    [ProductCategory.MUSIC]: 'musique',
    [ProductCategory.MOVIES]: 'films',
    [ProductCategory.GAMES]: 'jeux',
    [ProductCategory.OFFICE]: 'bureau',
    [ProductCategory.GROCERIES]: 'épicerie',
    [ProductCategory.TRAVEL]: 'voyage',
    [ProductCategory.KITCHEN]: 'cuisine',
    [ProductCategory.BABY]: 'bébé',
    [ProductCategory.STATIONERY]: 'papeterie',
    [ProductCategory.FURNITURE]: 'meubles',
    [ProductCategory.ART]: 'art',
    [ProductCategory.HANDMADE]: 'fait main',
    [ProductCategory.SOFTWARE]: 'logiciels',
    [ProductCategory.VIDEO_GAMES]: 'jeux vidéo',
    [ProductCategory.FITNESS]: 'fitness',
    [ProductCategory.OUTDOORS]: 'extérieur',
    [ProductCategory.CLOTHING]: 'vêtements',
    [ProductCategory.FOOTWEAR]: 'chaussures',
    [ProductCategory.ACCESSORIES]: 'accessoires',
    [ProductCategory.JEWELRY]: 'bijoux',
    [ProductCategory.WATCHES]: 'montres',
    [ProductCategory.BAGS]: 'sacs',
    [ProductCategory.SUNGLASSES]: 'lunettes de soleil',
    [ProductCategory.BELTS]: 'ceintures',
    [ProductCategory.SCARVES]: 'écharpes',
    [ProductCategory.HATS]: 'chapeaux',
    [ProductCategory.SOCKS]: 'chaussettes',
    [ProductCategory.UNDERWEAR]: 'sous-vêtements',
    [ProductCategory.SWIMWEAR]: 'maillots de bain',
    [ProductCategory.ACTIVEWEAR]: 'tenues sport',
    [ProductCategory.LOUNGEWEAR]: 'tenues intérieur',
    [ProductCategory.ATHLETICWEAR]: 'vêtements athlétiques',
    [ProductCategory.CASUALWEAR]: 'tenues décontractées',
    [ProductCategory.FORMALWEAR]: 'tenues habillées',
    [ProductCategory.OUTERWEAR]: 'manteaux',
    [ProductCategory.COATS]: 'manteaux longs',
    [ProductCategory.JACKETS]: 'vestes',
    [ProductCategory.PARKAS]: 'parkas',
    [ProductCategory.VESTS]: 'gilets',
    [ProductCategory.RAINCOATS]: 'imperméables',
    [ProductCategory.BOMBERS]: 'bombers',
    [ProductCategory.BLAZERS]: 'blazers',
    [ProductCategory.CARDIGANS]: 'cardigans',
};
export const LabelToProductCategory = Object.fromEntries(Object.entries(ProductCategoryLabels).map(([key, label]) => [
    label.toLowerCase(),
    key,
]));
//# sourceMappingURL=product_category.js.map