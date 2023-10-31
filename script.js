// PIXI.JSアプリケーションを呼び出す (この数字はゲーム内の画面サイズ)
const app = new PIXI.Application({ width: 500, height: 750 });

// index.htmlのbodyにapp.viewを追加する (app.viewはcanvasのdom要素)
document.body.appendChild(app.view);

// ゲームcanvasのcssを定義する
// ここで定義した画面サイズ(width,height)は実際に画面に表示するサイズ
app.renderer.view.style.position = "relative";

//現在のブラウザサイズの取得
app.renderer.view.style.height = document.body.clientHeight - 30;
app.renderer.view.style.width = ((app.renderer.view.style.height) * 2) / 3;
//app.renderer.view.style.height = "1500px";
//app.renderer.view.style.width = "1000px";

app.renderer.view.style.display = "block";

// canvasの周りを点線枠で囲う (canvasの位置がわかりやすいので入れている)
app.renderer.view.style.border = "2px dashed black";

// canvasの背景色
app.renderer.backgroundColor = 0xffffff;

// ゲームで使用する画像をあらかじめ読み込んでおく(プリロード)

PIXI.loader.add("player.png");
PIXI.loader.add("bg.png");
PIXI.loader.add("blockbase.png");
PIXI.loader.add("blocktx.png");

// プリロード処理が終わったら呼び出されるイベント
PIXI.loader.load((loader, resources) => {
    /**
     * 状態が変化する変数一覧
     */
    let gameLoops = []; // 毎フレーム毎に実行する関数たち
    let score = 0; // スコア
    let playerVx = 5; // プレイヤーの毎フレーム動くx方向
    let playerVy = 0; // プレイヤーの毎フレーム動くy方向
    //let blockRange = 1; // 足場の長さ
    let i = 0; // ループ用
    let j = 0; // ループ用

    /**
     * 毎フレーム処理を追加する関数
     */
    function addGameLoop(gameLoopFunction) {
        app.ticker.add(gameLoopFunction); // 毎フレーム処理として指定した関数を追加
        gameLoops.push(gameLoopFunction); // 追加した関数は配列に保存する（後で登録を解除する時に使う）
    }

    /**
     * 登録している毎フレーム処理を全部削除する関数
     */
    function removeAllGameLoops() {
        // gameLoopsに追加した関数を全部tickerから解除する
        for (const gameLoop of gameLoops) {
            app.ticker.remove(gameLoop);
        }
        gameLoops = []; // gameLoopsを空にする
    }
    /**
     * 全てのシーンを画面から取り除く関数
     */
    function removeAllScene() {
        // 既存のシーンを全部削除する
        for (const scene of app.stage.children) {
            app.stage.removeChild(scene);
        }
    }

    //最小値・最大値を引数に持ちランダムな数を返す関数
    function getRandom(min, max) {
        var random = Math.floor(Math.random() * (max + 1 - min)) + min;

        return random;
    }

    /**
     * ボタンを生成してオブジェクトを返す関数
     * @param text テキスト
     * @param width 横幅
     * @param height 縦幅
     */
    function createButton(text, width, height, color, onClick) {
        const fontSize = 20; // フォントサイズ
        const buttonAlpha = 0.6; // ボタン背景の透明度
        const buttonContainer = new PIXI.Container(); // ボタンコンテナ（ここにテキストと背景色を追加して返り値とする）

        // ボタン作成
        const backColor = new PIXI.Graphics(); // グラフィックオブジェクト（背景に半透明な四角を配置するために使用）
        backColor.beginFill(color, buttonAlpha); // 色、透明度を指定して描画開始
        backColor.drawRect(0, 0, width, height); // 位置(0,0)を左上にして、width,heghtの四角形を描画
        backColor.endFill(); // 描画完了
        backColor.interactive = true; // クリック可能にする
        backColor.on("pointerdown", onClick); // クリック時にonClickの関数を実行する
        buttonContainer.addChild(backColor); // 背景をボタンコンテナに追加

        // テキストに関するパラメータを定義する(ここで定義した意外にもたくさんパラメータがある)
        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial", // フォント
            fontSize: fontSize,// フォントサイズ
            fill: 0xffffff, // 色(16進数で定義するので#ffffffと書かずに0xffffffと書く)
            dropShadow: true, // ドロップシャドウを有効にする（右下に影をつける）
            dropShadowDistance: 2, // ドロップシャドウの影の距離
        });

        const buttonText = new PIXI.Text(text, textStyle); // テキストオブジェクトをtextStyleのパラメータで定義
        buttonText.anchor.x = 0.5; // アンカーを中央に設置する(アンカーは0~1を指定する)
        buttonText.anchor.y = 0.5; // アンカーを中央に設置する(アンカーは0~1を指定する)
        buttonText.x = width / 2; // ボタン中央にテキストを設置するため、width/2の値をx値に指定
        buttonText.y = height / 2; // ボタン中央テキストを設置するため、height/2の値をy値に指定
        buttonContainer.addChild(buttonText); // ボタンテキストをボタンコンテナに追加
        return buttonContainer; // ボタンコンテナを返す
    }
    /**
     * ゲームのメインシーンを生成する関数
     */
    function createGameScene() {
        // 他に表示しているシーンがあれば削除
        removeAllScene();
        // 毎フレームイベントを削除
        removeAllGameLoops();

        // スコアを初期化する
        score = 0;
        playerVy = 0;

        // ゲーム用のシーンを生成
        const gameScene = new PIXI.Container();
        // ゲームシーンを画面に追加
        app.stage.addChild(gameScene);

        // 背景を表示するスプライトオブジェクトを実体化させる
        const bg = new PIXI.Sprite(resources["bg.png"].texture); //引数には、プリロードしたURLを追加する
        bg.x = 0; // x座標
        bg.y = 0; // y座標
        bg.interactive = true; // クリック可能にする

        gameScene.addChild(bg); // 背景をシーンに追加

        const blockbase = new PIXI.Sprite(resources["blockbase.png"].texture); //引数には、プリロードしたURLを追加する
        blockbase.x = 0; // x座標
        blockbase.y = 590; // y座標

        gameScene.addChild(blockbase);

        const blocka = new PIXI.Sprite(resources["blocktx.png"].texture); //引数には、プリロードしたURLを追加する
        blocka.x = getRandom(-5, 5) * 50; // x座標
        blocka.y = 380; // y座標

        gameScene.addChild(blocka);

        const blockb = new PIXI.Sprite(resources["blocktx.png"].texture); //引数には、プリロードしたURLを追加する
        blockb.x = getRandom(-5, 5) * 50; // x座標
        blockb.y = 170; // y座標

        gameScene.addChild(blockb);

        const blockc = new PIXI.Sprite(resources["blocktx.png"].texture); //引数には、プリロードしたURLを追加する
        blockc.x = getRandom(-5, 5) * 50; // x座標
        blockc.y = -40; // y座標

        gameScene.addChild(blockc);

        const blockd = new PIXI.Sprite(resources["blocktx.png"].texture); //引数には、プリロードしたURLを追加する
        blockd.x = getRandom(-5, 5) * 50; // x座標
        blockd.y = -250; // y座標

        gameScene.addChild(blockd);

        const player = new PIXI.Sprite(resources["player.png"].texture); //引数には、プリロードしたURLを追加する
        player.x = 250; // x座標
        player.y = 530; // y座標

        bg.on("pointerdown", () =>      // クリック時に発動する関数
        {
            if (playerVy == 0) {
                playerVy = -15; // プレイヤーのＹ速度を-15にする(上に飛ぶようにしている)
            }
        });

        gameScene.addChild(player); // プレイヤーをシーンに追加


        // テキストに関するパラメータを定義する(ここで定義した意外にもたくさんパラメータがある)
        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial", // フォント
            fontSize: 20,// フォントサイズ
            fill: 0xffffff, // 色(16進数で定義するので#ffffffと書かずに0xffffffと書く)
            dropShadow: true, // ドロップシャドウを有効にする（右下に影をつける）
            dropShadowDistance: 2, // ドロップシャドウの影の距離
        });

        const text = new PIXI.Text("SCORE:0", textStyle); //スコア表示テキスト
        gameScene.addChild(text); // スコア表示テキストを画面に追加する

        function gameLoop() // 毎フレームごとに処理するゲームループ
        {
            // スコアテキストを毎フレームアップデートする
            text.text = `SCORE:${score}m`;
            //if (score == 0) return; // スコアが０の時(球に触っていないとき)はここで終了させる

            player.x += playerVx; // プレイヤーに速度を加算
            player.y += playerVy; // プレイヤーに速度を加算
            if (player.x > 440) // プレイヤーが右端に到達したら(画面横幅500,球横幅60、アンカーは左上なので500-60=440の位置で球が右端に触れる)
            {
                player.x = 440; // xの値を440にする(次のフレームで反射処理させないために必要) 
                playerVx = -playerVx; // 速度を反転して反射の挙動にする
            }
            if (player.x < 0) // プレイヤーが左端に到達したら(アンカーは左上なので、0の位置で球が左端に触れる)
            {
                player.x = 0; // xの値を0にする(次のフレームで反射処理させないために必要)
                playerVx = -playerVx; // 速度を反転して反射の挙動にする
            }
            if (playerVy < 9) {
                playerVy += 0.3; // yの速度に0.3を足していくと、重力みたいな挙動になる
            }
            if (player.y >= 800) // 球が画面下に消えたら
            {
                createEndScene(); // 結果画面を表示する
            }

            //一番下の足場の当たり判定
            if (blockbase.y < player.y + 68 && player.y + 54 < blockbase.y) {
                if (blockbase.x <= player.x + 60 && player.x <= blockbase.x + 500) {
                    if (playerVy >= 0) {
                        player.y = blockbase.y - 59; // プレイヤーのy座標を足場の上へ調整
                        playerVy = 0; // 下降をやめる
                    }
                }
            }

            //足場aの当たり判定
            if (blocka.y < player.y + 68 && player.y + 54 < blocka.y) {
                if (blocka.x <= player.x + 60 && player.x <= blocka.x + 350) {
                    if (playerVy >= 0) {
                        player.y = blocka.y - 59; // プレイヤーのy座標を足場の上へ調整
                        playerVy = 0; // 下降をやめる
                    }
                }
            }

            //足場bの当たり判定
            if (blockb.y < player.y + 68 && player.y + 54 < blockb.y) {
                if (blockb.x <= player.x + 60 && player.x <= blockb.x + 350) {
                    if (playerVy >= 0) {
                        player.y = blockb.y - 59; // プレイヤーのy座標を足場の上へ調整
                        playerVy = 0; // 下降をやめる
                    }
                }
            }

            //足場cの当たり判定
            if (blockc.y < player.y + 68 && player.y + 54 < blockc.y) {
                if (blockc.x <= player.x + 60 && player.x <= blockc.x + 350) {
                    if (playerVy >= 0) {
                        player.y = blockc.y - 59; // プレイヤーのy座標を足場の上へ調整
                        playerVy = 0; // 下降をやめる
                    }
                }
            }

            //足場dの当たり判定
            if (blockd.y < player.y + 68 && player.y + 54 < blockd.y) {
                if (blockd.x <= player.x + 60 && player.x <= blockd.x + 350) {
                    if (playerVy >= 0) {
                        player.y = blockd.y - 59; // プレイヤーのy座標を足場の上へ調整
                        playerVy = 0; // 下降をやめる
                    }
                }
            }

            if (blocka.y > 800) {
                blocka.x = getRandom(-5, 5) * 50; // x座標
                blocka.y = -40;
            }
            if (blockb.y > 800) {
                blockb.x = getRandom(-5, 5) * 50; // x座標
                blockb.y = -40;
            }
            if (blockc.y > 800) {
                blockc.x = getRandom(-5, 5) * 50; // x座標
                blockc.y = -40;
            }
            if (blockd.y > 800) {
                blockd.x = getRandom(-5, 5) * 50; // x座標
                blockd.y = -40;
            }

            blockbase.y += 1.5;
            blocka.y += 1.5;
            blockb.y += 1.5;
            blockc.y += 1.5;
            blockd.y += 1.5;
            score++; // スコアを１増やす

            //ゲーム画面のサイズを常に最適化
            app.renderer.view.style.height = document.body.clientHeight - 30;
            app.renderer.view.style.width = ((app.renderer.view.style.height) * 2) / 3;

        }

        // ゲームループ関数を毎フレーム処理の関数として追加
        addGameLoop(gameLoop);
    }

    /**
     * ゲームのスタートシーンを生成する関数
     */
    function createStartScene() {
        // 他に表示しているシーンがあれば削除
        removeAllScene();
        // 毎フレームイベントを削除
        removeAllGameLoops();

        // ゲーム用のシーン表示。引数に背景も読み込み
        const startScene = new PIXI.Container();
        // シーンを画面に追加する
        app.stage.addChild(startScene);

        // 背景を表示するスプライトオブジェクトを実体化させる
        const bg = new PIXI.Sprite(resources["bg.png"].texture); //引数には、プリロードしたURLを追加する
        bg.x = 0; // x座標
        bg.y = 0; // y座標

        startScene.addChild(bg); // 背景をシーンに追加

        // テキストに関するパラメータを定義する(ここで定義した意外にもたくさんパラメータがある)
        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial", // フォント
            fontSize: 32,// フォントサイズ
            fill: 0xfcbb08, // 色(16進数で定義する これはオレンジ色)
            dropShadow: true, // ドロップシャドウを有効にする（右下に影をつける）
            dropShadowDistance: 2, // ドロップシャドウの影の距離
        });

        // テキストオブジェクトの定義
        const text = new PIXI.Text(`ジャンプするだけのゲーム`, textStyle); // 結果画面のテキスト
        text.anchor.x = 0.5; // アンカーのxを中央に指定
        text.x = 250; // 座標指定 (xのアンカーが0.5で中央指定なので、テキストのx値を画面中央にすると真ん中にテキストが表示される)
        text.y = 300; // 座標指定 (yのアンカーはデフォルトの0なので、画面上から200の位置にテキスト表示)
        startScene.addChild(text); // スタート画面シーンにテキスト追加

        /**
         * 自作のボタン生成関数を使って、もう一度ボタンを生成
         * 引数の内容はcreateButton関数を参考に
         */
        const startButton = createButton("スタート", 100, 60, 0xff0000, () => {
            // クリックした時の処理
            createGameScene(); // ゲームシーンを生成する
        });
        startButton.x = 190; // ボタンの座標指定
        startButton.y = 550; // ボタンの座標指定
        startScene.addChild(startButton); // ボタンを結果画面シーンに追加
    }

    /**
     * ゲームの結果画面シーンを生成する関数
     */
    function createEndScene() {
        // 他に表示しているシーンがあれば削除
        removeAllScene();
        // 毎フレームイベントを削除
        removeAllGameLoops();

        // ゲーム用のシーン表示。引数に背景も読み込み
        const endScene = new PIXI.Container();
        // シーンを画面に追加する
        app.stage.addChild(endScene);

        // 背景を表示するスプライトオブジェクトを実体化させる
        const bg = new PIXI.Sprite(resources["bg.png"].texture); //引数には、プリロードしたURLを追加する
        bg.x = 0; // x座標
        bg.y = 0; // y座標

        endScene.addChild(bg); // 背景をシーンに追加

        // テキストに関するパラメータを定義する(ここで定義した意外にもたくさんパラメータがある)
        const textStyle = new PIXI.TextStyle({
            fontFamily: "Arial", // フォント
            fontSize: 32,// フォントサイズ
            fill: 0xfcbb08, // 色(16進数で定義する これはオレンジ色)
            dropShadow: true, // ドロップシャドウを有効にする（右下に影をつける）
            dropShadowDistance: 2, // ドロップシャドウの影の距離
        });

        // テキストオブジェクトの定義
        const text = new PIXI.Text(`SCORE:${score}mまで跳んだ！`, textStyle); // 結果画面のテキスト
        text.anchor.x = 0.5; // アンカーのxを中央に指定
        text.x = 250; // 座標指定 (xのアンカーが0.5で中央指定なので、テキストのx値を画面中央にすると真ん中にテキストが表示される)
        text.y = 300; // 座標指定 (yのアンカーはデフォルトの0なので、画面上から200の位置にテキスト表示)
        endScene.addChild(text); // 結果画面シーンにテキスト追加

        /**
         * 自作のボタン生成関数を使って、もう一度ボタンを生成
         * 引数の内容はcreateButton関数を参考に
         */
        const retryButton = createButton("もう一度", 100, 60, 0xff0000, () => {
            // クリックした時の処理
            createGameScene(); // ゲームシーンを生成する
        });
        retryButton.x = 100; // ボタンの座標指定
        retryButton.y = 600; // ボタンの座標指定
        endScene.addChild(retryButton); // ボタンを結果画面シーンに追加

        /**
         * 自作のボタン生成関数を使って、ツイートボタンを生成
         * 引数の内容はcreateButton関数を参考に
         */
        const tweetButton = createButton("ツイート", 100, 60, 0x0000ff, () => {
            //ツイートＡＰＩに送信
            //結果ツイート時にURLを貼るため、このゲームのURLをここに記入してURLがツイート画面に反映されるようにエンコードする
            const url = encodeURI("https://aomeyu.github.io/Jumpgame/"); // ツイートに載せるURLを指定(文字はエンコードする必要がある)
            //window.open(`http://twitter.com/intent/tweet?text=SCORE:${score}点で力尽きた&hashtags=sample&url=${url}`); //ハッシュタグをsampleにする
            window.open(`http://twitter.com/intent/tweet?text=【ジャンプするだけのゲーム】%0ASCORE: ${score}mまで跳んだ！%0A↓プレイはこちら↓%0A&url=${url}`); //「%0A」は改行コード
        });
        tweetButton.x = 300; // ボタンの座標指定
        tweetButton.y = 600; // ボタンの座標指定
        endScene.addChild(tweetButton); // ボタンを結果画面シーンに追加
    }

    // 起動直後はゲームシーンを追加する
    createStartScene();
});
