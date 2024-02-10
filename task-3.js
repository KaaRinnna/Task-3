import crypto from 'crypto';
import readlineSync from 'readline-sync';
import AsciiTable from 'ascii-table';
import __ from 'underscore';

let {argv} = process;
let moves = argv.splice(2);
if (moves.length === 0) {
    console.log('Please, enter at least 3 moves.')
    process.exit();
}

class CustomError {
  constructor(message) {
    this.message = message;
  }
  
  static get InvalidLength() {
      return new CustomError("Please, enter odd number of moves.");
  }

  static get InvalidArguments() {
    return new CustomError("Please, enter unreapeted moves.");
  }

  static get InvalidCount() {
      return new CustomError("Please, enter at least 3 moves.");
  }

  static get InvalidInput() {
      return new CustomError("Please, enter value from menu.");
  }

  toString() {
    return [
      "Argument error.",
      this.message,
      "Example: Rock Paper Scissors."
    ].join("\n");
  }
}

//function to check if array of moves has repeats
let isRepeat = function(){
  let result = false;
  for (let i=0; i < moves.length; i++){
      if (moves.indexOf(moves[i]) !== moves.lastIndexOf(moves[i])){ 
          result = true;
          break; 
      };
  }
  return (result ? true : false);
};

class RandomKey {
    constructor() {
        this.length = 256;
    }
    genKey() {
        return crypto.randomBytes(Math.ceil(this.length / 8)).toString('hex').slice(0, this.length);
    }
  }
const key = new RandomKey().genKey();

class CompMove {
    defMove(moves) {
        return __.sample(moves);
    }
}
const pcMove = new CompMove().defMove(moves);


class Hmac {
    constructor(key, pcMove) {
      this.key = key;
      this.pcMove = pcMove;
    }
    genHmac(key, pcMove) {
      return crypto.createHmac("sha3-256", key).update(pcMove).digest("hex");
    }
}
const hmac = new Hmac().genHmac(key, pcMove);


class GameRules {
    defRules(move1, move2) {
      return Math.sign((move1 - move2 + Math.floor(moves.length / 2) + moves.length) % moves.length - Math.floor(moves.length / 2));
    }
}
let rules = new GameRules();
const compMove = moves.indexOf(pcMove) + 1;

function getResultMessage(num) {
    return (num === 0 ? "It`s a Draw!" : num === -1 ? "You Win!" : "You Lose!");
}

class Table {
    genTable(size) {
        const table = new AsciiTable();
        table.setHeading('vPC|User>', ...moves);
        let rulesForTable;
        for (let i = 0; i < size; i++) {
            const row = [moves[i]];
            for (let j = 0; j < size; j++) {
                rulesForTable = rules.defRules(moves.indexOf(moves[i]), moves.indexOf(moves[j]));
                row.push(getResultMessage(rulesForTable));
            }
            table.addRow(...row);
        } 
        return table.toString();
    }
}
const table = new Table();

class Menu {
    constructor(hmac) {
      this.hmac = hmac;
    }

    createMenu(moves) {
        console.log("Start");
        console.log(`HMAC: ${this.hmac}`);
        console.log("Available moves:")
        moves.forEach((val, index) => {console.log(`${index + 1} - ${val}`);})
        console.log(`0 - exit`);
        console.log(`? - help`);
    }

    defMoves(){

        const move = readlineSync.question("Enter your move: ");
        if (move === '?') {
            console.log(table.genTable(moves.length))
        } else if(move === '0') {
            console.log("Finish");
        } else {
            console.log("Your move is " + moves[move - 1]);
            console.log("Computer move is " + pcMove);
            console.log(getResultMessage(rules.defRules(compMove, move)));
            console.log(`HMAC key: ${key}`);
        }
    }
}
const menu = new Menu(hmac);

switch(true) {
  case moves.length % 2 === 0:
    console.log(CustomError.InvalidLength.toString());
    break;
  case moves.length === 1:
    console.log(CustomError.InvalidCount.toString());
    break;
  case isRepeat():
    console.log(CustomError.InvalidArguments.toString());
    break;
  default:
    console.log(menu.createMenu(moves), menu.defMoves());
};
