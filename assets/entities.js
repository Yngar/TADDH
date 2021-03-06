// Create our Mixins namespace
Game.Mixins = {};

// Define our Moveable mixin
Game.Mixins.Moveable = {
    name: 'Moveable',
    tryMove: function (x, y, map) {
        var tile = map.getTile(x, y);
        var target = map.getEntityAt(x, y);
        // If an entity was present at the tile
        if (target) {
            // If we are an attacker, try to attack
            // the target
            if (this.hasMixin('Attacker')) {
                this.attack(target);
                return true;
            } else {
                // If not nothing we can do, but we can't 
                // move to the tile
                return false;
            }
            // Check if we can walk on the tile
            // and if so simply walk onto it
        } else if (tile.isWalkable()) {
            // Update the entity's position
            this._x = x;
            this._y = y;
            return true;
            // Check if the tile is diggable, and
            // if so try to dig it
        } else if (tile.isDiggable()) {
            map.dig(x, y);
            return true;
        }
        return false;
    }
}

// Main player's actor mixin
Game.Mixins.PlayerActor = {
    name: 'PlayerActor',
    groupName: 'Actor',
    act: function () {
        // Re-render the screen
        Game.refresh();
        // Lock the engine and wait asynchronously
        // for the player to press a key.
        this.getMap().getEngine().lock();
        // clear the message queue
        this.clearMessages();
    }
}
Game.Mixins.FungusActor = {
    name: 'FungusActor',
    groupName: 'Actor',
    init: function() {
        this._growthsRemaining = 5;
    },
    act: function () {
        // Check if fungus grows this turn
        if (this._growthsRemaining > 0) {
            if (Math.random() <= 0.02) {
                //Generate the coordinates of a random adjacent square by
                //generating an offset between [-1, 0, 1] for both the x 
                //and y directions. random rolls 0-2 -1
                var xOffset = Math.floor(Math.random() * 3) - 1;
                var yOffset = Math.floor(Math.random() * 3) - 1;
                //make sure its not this tile
                if (xOffset != 0 || yOffset != 0) {
                    //check if location is spawnable then grow
                    if(this.getMap().isEmptyFloor(this.getX() + xOffset,
                                                this.getY() + yOffset)) {
                        var entity = new Game.Entity(Game.FungusTemplate);
                        entity.setX(this.getX() + xOffset);
                        entity.setY(this.getY() + yOffset);
                        this.getMap().addEntity(entity);
                        this._growthsRemaining--;
                        Game.sendMessageNearby(this.getMap(),
                            entity.getX(), entity.getY(),
                            'The fungus is spreading.');
                    }
                }
            }
        }
    }
}

// This signifies our entity can attack basic destructible enities
Game.Mixins.Attacker = {
    name: 'Attacker',
    groupName: 'Attacker',
    init: function(template) {
        this._attackValue = template['attackValue'] || 1;
    },
    getAttackValue: function() {
        return this._attackValue;
    },
    attack: function (target) {
        // If the target is destructible, calculate the damage
        // based on attack and defense value
        if (target.hasMixin('Destructible')) {
            var attack = this.getAttackValue();
            var defense = target.getDefenseValue();
            var max = Math.max(0, attack - defense);
            var damage = 1 + Math.floor(Math.random() * max);

            Game.sendMessage(this, 'You hit the %s for %d damage!',
                [target.getName(), damage]);
            Game.sendMessage(target, 'The % hits you for %d damage!',
                [this.getName(), damage]);

            target.takeDamage(this, damage);
        }
    }
}

// This mixin signifies an entity can take damage and be destroyed
Game.Mixins.Destructible = {
    name: 'Destructible',
    init: function (template) {
        this._maxHp = template['maxHp'] || 10;
        //allow taking health from the template in case we want
        // the entity to start with a different amount of HP
        this._hp = template['hp'] || this._maxHp;
        this._defenseValue = template['defenseValue'] || 0;
    },
    getDefenseValue: function() {
        return this._defenseValue;
    },
    getHp: function () {
        return this._hp;
    },
    getMaxHp: function() {
        return this._maxHp;
    },
    takeDamage: function (attacker, damage) {
        this._hp -= damage;
        // If have 0 or less HP, then remove ourseles from the map
        if (this._hp <= 0) {
            Game.sendMessage(attacker, 'You kill the %s!', [this.getName()]);
            Game.sendMessage(this, 'You die!');
            this.getMap().removeEntity(this);
        }
    }
}
Game.Mixins.MessageRecipient = {
    name: 'MessageRecipient',
    init: function (template) {
        this._messages = [];
    },
    receiveMessage: function (message) {
        this._messages.push(message);
    },
    getMessages: function () {
        return this._messages;
    },
    clearMessages: function () {
        this._messages = [];
    }
}

Game.sendMessage = function (recipient, message, args) {
    //Make sure the recipient can receive the message
    // before trying to send it
    if (recipient.hasMixin(Game.Mixins.MessageRecipient)) {
        if (args) {
            message = vsprintf(message, args);
        }
        recipient.receiveMessage(message);
    }
}

Game.sendMessageNearby = function (map, centerX, centerY, message, args) {
    //If no args were passed, then format the message, else
    // no formatting is necessary
    if (args) {
        message = vsprintf(message, args);
    }
    // get the nearby entities
    entities = map.getEntitiesWithinRadius(centerX, centerY, 5);
    // iterate through nearby entities, sending the message if
    // they can receive it.
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].hasMixin(Game.Mixins.MessageRecipient)) {
            entities[i].receiveMessage(message);
        }
    }
}

// Player template
Game.PlayerTemplate = {
    character: '@',
    foreground: 'white',
    maxHp: 40,
    attackValue: 10,
    mixins: [Game.Mixins.Moveable, Game.Mixins.PlayerActor,
                Game.Mixins.Attacker, Game.Mixins.Destructible,
                Game.Mixins.MessageRecipient]
}
// Fungus template
Game.FungusTemplate = {
    name: 'fungus',
    character: 'F',
    foreground: 'green',
    maxHp: 10,
    mixins: [Game.Mixins.FungusActor, Game.Mixins.Destructible]
}
