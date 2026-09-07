import {type MenuNavBinding} from '@antha/input';

export enum PlayerBinding {
    PlayerLeft = 'player-left',
    PlayerRight = 'player-right',
    PlayerUp = 'player-up',
    PlayerDown = 'player-down',
}

export type GameBinding = PlayerBinding | MenuNavBinding;
