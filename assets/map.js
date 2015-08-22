Game.Map = function(tiles){
    this._tiles = tiles;
    // cache the width and height based on the length of the dimentions of the tile array
    this._width = tiles.length;
    this._height = tiles[0].length;
};

// getters
Game.Map.prototype.getWidth = function() {
    return this._width;
};
Game.Map.prototype.getHeight = function() {
    return this._height;
};

// gets the tile at coordinates
Game.Map.prototype.getTile = function(x,y) {
    // return null if out of bounds
    if(x < 0 || x >= this._width || y < 0 || y >= this._height) {
        return Game.Tile.nullTile;
    } else {
        return this._tiles[x][y] || Game.Tile.nulltile;
    }
}