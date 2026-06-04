import Experience from "../Experience"
import World from "../classes/World"
import Squares from "../components/Squares"
import FallingBody from "../components/FallingBody"
import GUI from "lil-gui"


type SquaresEffect = 'kick' | 'none'

const EFFECTS: SquaresEffect[] = ['kick', 'none']

export default class SquaresFallingScene extends World {

    private exp: Experience
    private squares: Squares
    private fallingBody: FallingBody
    private guiFolder!: GUI

    constructor(exp: Experience) {
        super()
        this.exp = exp
        this.squares = new Squares(exp)
        this.fallingBody = new FallingBody(exp)

        this.setupGUI()
        this.setVisible(false)
    }

    private setupGUI() {
        this.guiFolder = this.exp.helpers.GUI.addFolder('SquaresFalling')
        this.guiFolder.hide()
    }

    onReady() {
        this.squares.onReady()
    }

    setVisible(v: boolean) {
        let effect = '';
        if (v) {
            effect = EFFECTS[Math.floor(Math.random() * EFFECTS.length)]
        }
        this.squares.setVisible(v, effect)
        this.fallingBody.setVisible(v, effect)
    }

    showGUI(v: boolean) {
        v ? this.guiFolder.show() : this.guiFolder.hide()
        this.squares.showGUI(v)
        this.fallingBody.showGUI(v)
    }

    onBPMBeat() {
        this.fallingBody.onBPMBeat()
        this.squares.onBPMBeat()
    }

    update() {
        this.squares.update()
        this.fallingBody.update()
    }

    leave() {
        this.squares.leave()
        this.fallingBody.leave()
    }
}
