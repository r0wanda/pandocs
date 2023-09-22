import bl from 'blessed';
import figlet from 'figlet';
import Api from './Api.mjs';

class Tui extends Api {
    scr;
    boxes;
    constructor() {
        super();
        this.boxes = {
            splash: null,
            splashText: null,
            bar: null,
        }
        this.scr = bl.screen({
            smartCSR: true,
            fullUnicode: true
        });
        this.scr.title = 'Pandora';
        this.scr.key(['escape', 'C-c'], () => process.exit(0));
        this.scr.key(['C-r'], () => this.scr.render());
        this.boxes.splash = bl.box({
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            style: {
                fg: 'white',
                bg: 'blue'
            }
        });
        this.boxes.splashText = bl.text({
            top: 'center',
            left: 'center',
            width: 'shrink',
            height: 'shrink',
            content: figlet.textSync('Pandora', {
                font: 'ANSI Shadow',
            }),
            style: {
                fg: 'black',
                bg: 'blue'
            }
        });
        this.boxes.splash.append(this.boxes.splashText);
        this.scr.append(this.boxes.splash);
        this.boxes.splash.focus();
        this.scr.render();
    }
    async init() {
        await super.init();
        this.boxes.splash.destroy();
        this.scr.render();
    }
}

export default Tui;