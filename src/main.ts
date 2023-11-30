import "./style.css";

import Phaser from "phaser";

type Fruit = {
  name: string;
  radius: number;
};

const fruits: Fruit[] = [
  { name: "1", radius: 30 },
  { name: "2", radius: 35 },
  { name: "3", radius: 40 },
  { name: "4", radius: 50 },
  { name: "5", radius: 65 },
  { name: "6", radius: 70 },
  { name: "7", radius: 80 },
  { name: "8", radius: 90 },
  { name: "9", radius: 100 },
  { name: "10", radius: 110 },
  { name: "11", radius: 120 },
];

class Main extends Phaser.Scene {
  score = 0;
  dropper!: Phaser.GameObjects.Image;
  group!: Phaser.GameObjects.Group;
  ceiling!: MatterJS.BodyType;
  gameOver = false;

  preload() {
    this.load.image("tombstone", "tombstone.png");

    for (const fruit of fruits) {
      this.load.image(`${fruit.name}`, `${fruit.name}.png`);
    }
  }

  updateDropper(fruit: Fruit) {
    this.dropper
      .setTexture(fruit.name)
      .setName(fruit.name)
      .setDisplaySize(fruit.radius * 2, fruit.radius * 2)
      .setY(fruit.radius + 205);
    this.setDropperX(this.input.activePointer.x);

    this.group.getChildren().forEach((gameObject) => {
      if (gameObject instanceof Phaser.GameObjects.Image) {
        gameObject.postFX.clear();

        if (gameObject.name === fruit.name) {
          gameObject.postFX.addShine();
        }
      }
    });
  }

  setDropperX(x: number) {
    const p = 65;
    const r = this.dropper.displayWidth / 2;
    if (x < r + p) {
      x = r + p;
    } else if (x > +this.game.config.width - r - p) {
      x = +this.game.config.width - r - p;
    }
    this.dropper.setX(x);
  }

  addFruit(x: number, y: number, fruit: Fruit) {
    return this.matter.add
      .image(x, y, fruit.name)
      .setName(fruit.name)
      .setDisplaySize(fruit.radius * 2, fruit.radius * 2)
      .setCircle(fruit.radius)
      .setFriction(0.005)
      .setBounce(0.2)
      .setDepth(-1)
      .setOnCollideWith(this.ceiling, () => {
        this.events.emit("ceilinghit");
      });
  }

  create() {
    this.add
      .nineslice(0, 0, "tombstone")
      .setOrigin(0)
      .setDisplaySize(+this.game.config.width, +this.game.config.height)
      .setPipeline("Light2D")
      .setDepth(-2)
      .postFX.addBokeh();

    this.add
      .nineslice(0, 0, "tombstone")
      .setOrigin(0)
      .setDisplaySize(+this.game.config.width, +this.game.config.height)
      .setPipeline("Light2D")
      .setDepth(-2);

    this.matter.world.setBounds(
      65,
      0,
      +this.game.config.width - 130,
      +this.game.config.height - 1
    );
    this.group = this.add.group();

    const light = this.lights
      .addLight(
        this.input.activePointer.x,
        this.input.activePointer.y,
        1000,
        0x4b0082,
        0.75
      )
      .setScrollFactor(0);
    this.lights.enable().setAmbientColor(0xdddddd);

    const button = this.add
      .rectangle(
        +this.game.config.width / 2,
        +this.game.config.height / 2,
        260,
        100,
        0x333333
      )
      .setInteractive({ useHandCursor: true })
      .setPipeline("Light2D")
      .setVisible(false);
    const buttonText = this.add
      .text(
        +this.game.config.width / 2,
        +this.game.config.height / 2,
        "New Game",
        {
          fontFamily: "Pirata One",
          fontSize: "40px",
          color: "#CCCCCC",
        }
      )
      .setStroke("#111111", 6)
      .setOrigin(0.5)
      .setVisible(false);
    button.on("pointerover", () => {
      button.fillColor = 0x444444;
    });
    button.on("pointerout", () => {
      button.fillColor = 0x333333;
    });
    button.on("pointerup", () => {
      this.score = 0;
      this.gameOver = false;
      this.scene.restart();
    });

    const scoreText = this.add
      .text(0, 110, `${this.score.toLocaleString()}`, {
        fontFamily: "Pirata One",
        fontSize: "48px",
        align: "center",
        fixedWidth: +this.game.config.width,
      })
      .setColor("#CCCCCC")
      .setStroke("#333333", 8)
      .setShadow(2, 2, "#111111", 2, false, true);

    this.dropper = this.add.image(
      this.input.activePointer.x,
      0,
      fruits[0].name
    );
    const glow = this.dropper.postFX.addGlow(0x4b0082);
    this.tweens.addCounter({
      yoyo: true,
      repeat: -1,
      from: 1,
      to: 3,
      duration: 1000,
      onUpdate: function (tween) {
        glow.outerStrength = tween.getValue();
      },
    });
    this.updateDropper(fruits[0]);

    this.ceiling = this.matter.add.rectangle(
      +this.game.config.width / 2,
      100,
      +this.game.config.width,
      200
    );
    this.ceiling.isStatic = true;

    const line = this.add
      .rectangle(160, 200, +this.game.config.width - 320, 2, 0xffffff)
      .setOrigin(0)
      .setAlpha(0.1)
      .setDepth(-2);
    line.postFX.addShine();
    line.postFX.addGlow();

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.setDropperX(pointer.x);
      light.setPosition(pointer.x, pointer.y);
    });

    this.input.on("pointerup", () => {
      if (!this.dropper.visible || this.gameOver) {
        return;
      }

      this.dropper.setVisible(false);
      this.time.delayedCall(500, () => this.dropper.setVisible(!this.gameOver));

      const currentFruit = fruits.find(
        (fruit) => fruit.name === this.dropper.name
      )!;

      const gameObject = this.addFruit(
        this.dropper.x,
        this.dropper.y,
        currentFruit
      );
      this.group.add(gameObject);

      const nextFruit = fruits[Math.floor(Math.random() * 5)];
      this.updateDropper(nextFruit);
    });

    this.matter.world.on(
      "collisionstart",
      (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
        for (const pair of event.pairs) {
          if (pair.bodyA.gameObject?.name === pair.bodyB.gameObject?.name) {
            const fruitIndex = fruits.findIndex(
              (fruit) => fruit.name === pair.bodyA.gameObject?.name
            );

            if (fruitIndex === -1) {
              continue;
            }

            this.score += (fruitIndex + 1) * 2;
            scoreText.setText(`${this.score.toLocaleString()}`);

            pair.bodyA.gameObject.destroy();
            pair.bodyB.gameObject.destroy();

            const newFruit = fruits[fruitIndex + 1];

            if (!newFruit) {
              continue;
            }

            const gameObject = this.addFruit(
              pair.bodyB.position.x,
              pair.bodyB.position.y,
              newFruit
            );
            this.group.add(gameObject);

            return;
          }
        }
      }
    );

    this.events.on("ceilinghit", () => {
      this.gameOver = true;
      button.setVisible(true);
      buttonText.setVisible(true);
      this.dropper.setVisible(false);
    });
  }
}

new Phaser.Game({
  scene: [Main],
  width: 600,
  height: 1000,
  scale: {
    mode: Phaser.Scale.ScaleModes.FIT,
  },
  autoCenter: Phaser.Scale.Center.CENTER_HORIZONTALLY,
  transparent: true,
  physics: {
    default: "matter",
    matter: {
      debug: false,
    },
  },
});
