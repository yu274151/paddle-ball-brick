		const PADDLE_WIDTH = 100;
		const PADDLE_HEIGHT = 20;
		const BRICKS_WIDTH = 60;
		const BRICKS_HEIGHT = 30;
		const BALL_RADIUS = 8;
		const FULL_X_SPEED = 7;
		
		//Game artifacts: stage(canvas), paddle, brick and ball
		let stage;
		let paddle;
		let ball;
		let brick;

		//A collection of all brick in the grid
		let bricks = [];

		let score = 0; // initial score set at 0
		let lives = 3; // no. of lives set at 3
		
		//informational text revealing current score
		let scoreText;

		//setting initial state of game as false or not started (only starts with mouse or keyboard action)
		let gameStarted = false;

		//Keyboard controls: left, right and spacebar to start the game
		const KEYCODE_LEFT = 37;
   		const KEYCODE_RIGHT = 39
		const SPACEBAR = 32;
		
		// callbacks actioned upon keyboard left and right respectively
   		let keyboardMoveLeft = false;
   		let keyboardMoveRight = false;
		   
		let highScore = 0; // initial high score set at 0

		// function called on index.html after all DOM elements finished loading
		function init()
		{	
			//Using local storage to save user score
			if(typeof(Storage) !== "undefined") {
			    if(localStorage.highScore==undefined)
			    {
			    	localStorage.highScore = 0;
			    }
			    highScore = localStorage.highScore;
			} else {
			    highScore = 0;
			}
			//sets the Stage
			stage = new createjs.Stage("testCanvas");
			//Enabling mobile touch
			createjs.Touch.enable(stage);

			//Game artifact creations: paddle, ball, grid of brick
			createPaddle();
			createBall();
			createBrickGrid(); 

			//Sets informative score message
			createScoreText();

			stage.canvas.height = window.innerHeight;
			createjs.Ticker.setFPS(60); //set at 60 GFP
			createjs.Ticker.addEventListener("tick", tick); //Changed to tick from stage

			//mouse down event handler simply starts the game by calling startLevel
			stage.on("stagemousedown", function(event) 
				{ 
					startLevel();
					
				});
			//mouse move eventhandler moves the paddle accordingly	
			stage.on("stagemousemove", function (event)
			{
				paddle.x = stage.mouseX;
			});

			//keyboard handlers
   			window.onkeyup = keyUpHandler;
   			window.onkeydown = keyDownHandler;
		}

		function startLevel()
		{
			if(!gameStarted)
					{
						gameStarted = true; 

						//Both speed in x and y direction set to 5px default
						ball.xSpeed = 5; 
						ball.ySpeed = 5;

						//Sets the initial co-ordinate of the ball up to the right
						ball.up = true; 
						ball.right = true;
					}
		}

		function keyDownHandler(e)
 		{
   			switch(e.keyCode)
   			{
    		case KEYCODE_LEFT:  keyboardMoveLeft = true; break;
    		case KEYCODE_RIGHT: keyboardMoveRight = true; break;
    		case SPACEBAR: startLevel(); break;
    		} 
  		}
  		function keyUpHandler(e)
 		{
   			switch(e.keyCode)
   			{
    			case KEYCODE_LEFT:  keyboardMoveLeft = false; break;
    			case KEYCODE_RIGHT: keyboardMoveRight = false; break;
    		} 
		}
		
		//Helper function to increment 
		function addToScore(points)
		{
			score+=points; //Destroying each brick amount to 100 points
			updateStatusLine();
		}
		function createScoreText()
		{
			scoreText = new createjs.Text("Score: 0", "16px Arial", "#000000");
			addToScore(0); //initial point achieved at the start of the game is 0
			scoreText.y = stage.canvas.height - 16;
			stage.addChild(scoreText);
		}

		//Auxilliary function to update score, lives and high score (i.e. overall status)
		function updateStatusLine()
		{
			scoreText.text = "Score: "+score + " / Lives: "+lives+" / High Score: "+highScore;
		}

		//Life is lost when the ball falls off the paddle i.e. the latter couldn't catch it
		function loseLife()
		{
			lives--;
			ball.xSpeed = 0;
			ball.ySpeed = 0;
			ball.x = paddle.x;
			ball.y = paddle.y - PADDLE_HEIGHT/2 - BALL_RADIUS;
			gameStarted = false;
			if(lives==0)
			{
				if(highScore<score)
				{
					highScore = score;
					localStorage.highScore = score;
				}
				lives = 3; //When all lives are lost, set it to initial value of 3
				score = 0;
			}
			updateStatusLine();
		}


		function tick(event)
		{
			if(keyboardMoveLeft)
				{
					paddle.x -= 10;
				}
			if(keyboardMoveRight)
				{
					paddle.x += 10;
				}
			//Ensures the paddle is well within the canvas width

			if(paddle.x+PADDLE_WIDTH/2 > stage.canvas.width)
				{
					paddle.x = stage.canvas.width - PADDLE_WIDTH / 2;
				}
			if(paddle.x-PADDLE_WIDTH/2 < 0)
				{
					paddle.x = PADDLE_WIDTH / 2;
				}
			
			// The ball needs to be in-sync with that of the paddle's co-ordinates
			if(!gameStarted)
			{
				ball.x = paddle.x;
				ball.y = paddle.y - PADDLE_HEIGHT/2  - BALL_RADIUS;
				stage.update();
				return;
			}
			if(ball.up)
			{
				ball.y -= ball.ySpeed; //decreases the ball's y-coordinate if it's in upward trajectory
				
			}
			else
			{
				ball.y += ball.ySpeed; //increases the ball's y-coordinate if downward
			}
			if(ball.right)
			{
				ball.x += ball.xSpeed;
			}
			else
			{
				ball.x -= ball.xSpeed;
			}
			//Goes over all the bricks from the grid; if the ball is can demolish, add 100 points
			for(let i=0;i<bricks.length;i++)
			{
				if(checkCollision(ball,bricks[i]))
				{
					addToScore(100);
					destroyBrick(bricks[i]);
					bricks.splice(i,1);
					i--; //post demolition the brick gets removed and disappears from the grid/screen; i-value needs to be adjusted

				}
			}
			if(checkCollision(ball,paddle))
			{
				newBallXSpeedAfterCollision(ball,paddle);
			}
			
			//Below logic checks whether the ball is in the confinement of the canvas
			if(ball.x+BALL_RADIUS >= stage.canvas.width)
			{
				ball.x = stage.canvas.width-BALL_RADIUS;
				ball.right = false;
			}
			if(ball.x-BALL_RADIUS <= 0)
			{
				ball.x = BALL_RADIUS;
				ball.right = true;
			}
			if(ball.y-BALL_RADIUS <= 0)
			{
				ball.y = BALL_RADIUS;
				ball.up = false;
			}
			//The ball falls over the canvas area
			if(ball.y + BALL_RADIUS >= stage.canvas.height)
			{
				loseLife();
			}
			// ball's last co-ordinates need to update (part of its state)
			ball.lastX = ball.x;
			ball.lastY = ball.y;
			stage.update();
		}

		//hitElement can either be the paddle or the canvas stage boundary

		function checkCollision(ballElement,hitElement)	{
			//Obtaining the rectangular co-ordinates of the stage/paddle

			let leftBorder = (hitElement.x - hitElement.getBounds().width/2);
			let rightBorder = (hitElement.x + hitElement.getBounds().width/2);
			let topBorder = (hitElement.y - hitElement.getBounds().height/2);
			let bottomBorder = (hitElement.y + hitElement.getBounds().height/2);

			//Obtaining the previous borders of the ball

			let previousBallLeftBorder = ballElement.lastX - BALL_RADIUS;
			let previousBallRightBorder = ballElement.lastX + BALL_RADIUS;
			let previousBallTopBorder = ballElement.lastY - BALL_RADIUS;
			let previousBallBottomBorder = ballElement.lastY + BALL_RADIUS;

			//Updated borders of the ball

			let ballLeftBorder = ballElement.x - BALL_RADIUS;
			let ballRightBorder = ballElement.x + BALL_RADIUS;
			let ballTopBorder = ballElement.y - BALL_RADIUS;
			let ballBottomBorder = ballElement.y + BALL_RADIUS;

			if((ballLeftBorder <= rightBorder) && (ballRightBorder >= leftBorder) && (ballTopBorder <= bottomBorder) && (ballBottomBorder >= topBorder))
			{
				if((ballTopBorder <= bottomBorder)&&(previousBallTopBorder > bottomBorder))
				{
					//Hit from the bottom
					ballElement.up = false;
					ballElement.y = bottomBorder + BALL_RADIUS;
				}
				if((ballBottomBorder >= topBorder)&&(previousBallBottomBorder<topBorder))
				{
					//Hit from the top
					ballElement.up = true;
					ballElement.y = topBorder - BALL_RADIUS;
				}
				if((ballLeftBorder<=rightBorder)&&(previousBallLeftBorder > rightBorder))
				{
					//Hit from the right
					ballElement.right = true;
					ballElement.x = rightBorder + BALL_RADIUS;
				}
				if((ballRightBorder >= leftBorder)&&(previousBallRightBorder < leftBorder))
				{
					//Hit from the left
					ballElement.right = false;
					ballElement.x = leftBorder - BALL_RADIUS;
				}
				ballElement.lastX = ballElement.x;
				ballElement.lastY = ballElement.y;
				return true;
			}
			return false;
		}

		//Requisite logic to co-ordinate the ball and the paddle

		function newBallXSpeedAfterCollision(ballElement,hitElement)
		{
			let startPoint = hitElement.x - hitElement.getBounds().width/2;
			let midPoint =  hitElement.x;
			let endPoint = hitElement.x + hitElement.getBounds().width/2;
			//FULL_SPEED is a constant to speed up the ball

			if(ballElement.x < midPoint)
			{
				ball.right = false;
				//midPoint > x-coordinate of the ball
				ball.xSpeed = FULL_X_SPEED - ((ballElement.x - startPoint)/(midPoint-startPoint)) * FULL_X_SPEED
			}
			else
			{
				ball.xSpeed = FULL_X_SPEED - ((endPoint - ballElement.x)/(endPoint-midPoint)) * FULL_X_SPEED
				ball.right = true;	
			}
		}
		
		//Creates a 14X5 grid of bricks
		function createBrickGrid()
		{
			for(let i = 0;i<14;i++)
				for(let j = 0;j<5;j++)
				{	//Adds 10px interspace between bricks in a row; 5px in columns
					createBrick(i*(BRICKS_WIDTH+10)+40,j*(BRICKS_HEIGHT+5)+20);
				}
		}
		function createBrick(x,y)
		{
			brick = new createjs.Shape();
	        brick.graphics.beginFill('#000F2F');
	        brick.graphics.drawRect(0, 0, BRICKS_WIDTH, BRICKS_HEIGHT);
	        brick.graphics.endFill();
	        brick.regX = BRICKS_WIDTH/2;
	        brick.regY = BRICKS_HEIGHT/2;
	        brick.x = x;
			brick.y = y;

			//Bounds ought to be set for the ball to correctly demolish (making sure it's within the width/height of the brick)
	        brick.setBounds(brick.regX,brick.regY,BRICKS_WIDTH,BRICKS_HEIGHT);
			
			stage.addChild(brick);
	        bricks.push(brick);
	    }
		function destroyBrick(brick)
		{

			createjs.Tween.get(brick,{}).to({scaleX:0,scaleY:0}, 500)
			setTimeout(removeBrickFromScreen,500,brick) //Demolished brick needs to be removed from the screen
		}
		function removeBrickFromScreen(brick)
		{	
			stage.removeChild(brick);
		}
		function createBall()
		{
			ball = new createjs.Shape();
			ball.graphics.beginFill("Red").drawCircle(0,0, BALL_RADIUS);

			//The ball should always stay on top of the paddle
			ball.x = paddle.x;
			ball.y = paddle.y - PADDLE_HEIGHT/2  - BALL_RADIUS;
			stage.addChild(ball);

			ball.up = true;
			ball.right = true;
			ball.xSpeed = 0;
			ball.ySpeed = 0;
			ball.lastX = 0;
			ball.lastY = 0;
		}
		function createPaddle()
		{
			paddle = new createjs.Shape();
		    paddle.width = PADDLE_WIDTH;
		    paddle.height = PADDLE_HEIGHT;
		    paddle.graphics.beginFill('#000000').drawRect(0, 0, paddle.width, paddle.height);
		    paddle.x = stage.canvas.width/2 - PADDLE_WIDTH/2;
			paddle.y = stage.canvas.height*0.9;
			
		    paddle.regX = PADDLE_WIDTH/2;
			paddle.regY = PADDLE_HEIGHT/2;
			
		    paddle.setBounds(paddle.regX,paddle.regY,PADDLE_WIDTH,PADDLE_HEIGHT);
		    stage.addChild(paddle);
		}