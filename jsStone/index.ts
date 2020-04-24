interface Player {
    hero: HTMLDivElement;
    deck: HTMLDivElement;
    field: HTMLDivElement;
    cost: HTMLDivElement;
    deckData: Card[];
    heroData?: Card | null;
    fieldData: Card[];
    chosenCard?: HTMLDivElement | null;
    chosenCardData?: Card | null;
}

interface Card {
    att: number;
    hp: number;
    mine: boolean;
    field: boolean;
    cost?: number;
    hero?: boolean;
}

class Hero implements Card {
    public att: number;
    public hp: number;
    public hero: boolean;
    public field: boolean;
    public mine: boolean;

    constructor(mine: boolean) {
        this.att = Math.ceil(Math.random() * 2);
        this.hp = Math.ceil(Math.random() * 5) + 25;
        this.hero = true;
        this.field = true;
        this.mine = mine;
    }
}

class Sub implements Card {
    public att: number;
    public hp: number;
    public cost: number;
    public field: boolean;
    public mine: boolean;

    constructor(mine: boolean) {
        this.att = Math.ceil(Math.random() * 5);
        this.hp = Math.ceil(Math.random() * 5);
        this.cost = Math.floor((this.att + this.hp) / 2);
        this.field = false;
        this.mine = mine;
    }
}


const opponent: Player = {
    hero: document.getElementById('rival-hero') as HTMLDivElement,
    deck: document.getElementById('rival-deck') as HTMLDivElement,
    field: document.getElementById('rival-cards') as HTMLDivElement,
    cost: document.getElementById('rival-cost') as HTMLDivElement,
    deckData: [],
    heroData: null,
    fieldData: [],
    chosenCard: null,
    chosenCardData: null,
}

const me: Player = {
    hero: document.getElementById('my-hero') as HTMLDivElement,
    deck: document.getElementById('my-deck') as HTMLDivElement,
    field: document.getElementById('my-cards') as HTMLDivElement,
    cost: document.getElementById('my-cost') as HTMLDivElement,
    deckData: [],
    heroData: null,
    fieldData: [],
    chosenCard: null,
    chosenCardData: null,
}

function isSub(data: Card): data is Sub {
    if (data.cost) {
        return true;
    }
    return false;
}

function isHero(data: Card): data is Hero {
    if (data.hero) {
        return true;
    }
    return false;
}

const turnButton = document.getElementById('turn-btn') as HTMLButtonElement;
let turn = true;

function initiate() {
    [opponent, me].forEach(function (item) {
        item.deckData = [];
        item.heroData = null;
        item.fieldData = [];
        item.chosenCard = null;
        item.chosenCardData = null;
    });

    createDeck({ mine: false, count: 5 });
    createDeck({ mine: true, count: 5 });
    createHero({ mine: false });
    createHero({ mine: true });
    redrawScreen({ mine: false });
    redrawScreen({ mine: true });
}

initiate();

function createDeck({ mine, count }: { mine: boolean; count: number }) {
    const player = mine ? me : opponent;
    for (let i = 0; i < count; i++) {
        player.deckData.push(new Sub(mine));
    }
    redrawDeck(player);
}

function createHero({ mine }: { mine: boolean }) {
    const player = mine ? me : opponent;
    player.heroData = new Hero(mine);
    connectCardDOM({ data: player.heroData, DOM: player.hero, hero: true});
}

function redrawScreen({ mine }: { mine: boolean }) {
    const player = mine ? me : opponent;
    redrawField(player);
    redrawDeck(player);
    redrawHero(player);
}

function redrawField(target: Player) {
    target.field.innerHTML = '';
    target.fieldData.forEach(function(data) {
        connectCardDOM({ data: data, DOM: target.field });
    });
}

function redrawDeck(target: Player) {
    target.deck.innerHTML = '';
    target.deckData.forEach(function(data) {
        connectCardDOM({ data: data, DOM: target.deck });
    });
}

function redrawHero(target: Player) {
    if (!target.heroData) {
        console.error(target);
        throw new Error('heroData가 없습니다');
    }
    target.hero.innerHTML = '';
    connectCardDOM({ data: target.heroData, DOM: target.hero, hero: true });
}

function connectCardDOM({ data, DOM, hero = false } : { data: Card, DOM: HTMLElement, hero?: boolean }) {
    const cardEl = document.querySelector('.card-hidden .card')!.cloneNode(true) as HTMLDivElement;
    cardEl.querySelector('.card-att')!.textContent = String(data.att);
    cardEl.querySelector('.card-hp')!.textContent = String(data.hp);

    if (hero) {
        (cardEl.querySelector('.card-cost') as HTMLDivElement).style.display = 'none';
        const name = document.createElement('div');
        name.textContent = '영웅';
        cardEl.appendChild(name)
    } else {
        cardEl.querySelector('.card-cost')!.textContent = String(data.cost);
    }

    cardEl.addEventListener('click', function() {
        if (isSub(data) && data.mine === turn && !data.field) {
            if (!deckToField({ data })) {
                createDeck({ mine: turn, count: 1 });
            }
        }
        turnAction({ cardEl, data });
    });
    DOM.appendChild(cardEl);
}

function deckToField({ data }: { data: Sub }): boolean {
    const target = turn ? me : opponent;
    const currentCost = Number(target.cost.textContent);
    
    if (currentCost < data.cost) {
        alert('코스트가 부족합니다.');
        return true;
    }
    
    data.field = true;
    const idx = target.deckData.indexOf(data);
    target.deckData.splice(idx, 1);
    target.fieldData.push(data);

    redrawField(target);
    redrawDeck(target);

    target.cost.textContent = String(currentCost - data.cost);
    return false;
}

function turnAction({ cardEl, data }: { cardEl: HTMLDivElement, data: Card }) {
    const team = turn ? me : opponent;
    const enemy = turn ? opponent : me;

    if (cardEl.classList.contains('card-turnover')) {
        return;
    }

    const enemyCard = turn ? !data.mine : data.mine;

    if (enemyCard && team.chosenCardData) {
        data.hp = data.hp - team.chosenCardData.att;
        if (data.hp <= 0) {
            if (isSub(data)) {
                const index = enemy.fieldData.indexOf(data);
                enemy.fieldData.splice(index, 1);
            } else {
                alert('승리하셨습니다!');
                initiate();
            }
        }

        redrawScreen({ mine: !turn });
        if (team.chosenCard) {
            team.chosenCard.classList.remove('card-selected');
            team.chosenCard.classList.add('card-turnover');
        }

        team.chosenCard = null;
        team.chosenCardData = null;
        return;
    } else if (enemyCard) {
        return;
    }

    if (data.field) {
        document.querySelectorAll('.card').forEach(function (card) {
            card.classList.remove('card-selected');
        });
        console.log(cardEl);
        cardEl.classList.add('card-selected');
        team.chosenCard = cardEl;
        team.chosenCardData = data;
    }
}

turnButton.addEventListener('click', function() {
    const target = turn ? me : opponent;
    document.getElementById('rival')!.classList.toggle('turn');
    document.getElementById('my')!.classList.toggle('turn');

    redrawField(target);
    redrawHero(target);
    turn = !turn;
    if (turn) {
        me.cost.textContent = '10';
    } else {
        opponent.cost.textContent = '10';
    }
});