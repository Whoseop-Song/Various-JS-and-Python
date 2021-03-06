// Generated by CoffeeScript 1.12.5
(function() {
  var H, W, draw, mainLoop, now;

  W = 900;

  H = 400;

  now = Date.now;

  mainLoop = function() {
    var canvas, center, ctx, env, keysMap, keysState, obj, prevT, runOnce;
    env = new Environment();
    center = new P(W / 2, H / 2);
    obj = new RigObject(center, 10);
    env.friction = 0.00005;
    env.gravity = new Force(0, 0.0005);
    env.addObject(obj, true);
    keysMap = {
      37: 'left',
      39: 'right',
      38: 'up',
      40: 'down'
    };
    keysState = keysStatusMonitor(keysMap);
    canvas = $('#canvas');
    canvas.attr({
      width: W,
      height: H
    });
    ctx = canvas.get(0).getContext('2d');
    prevT = now();
    runOnce = function(frameTime) {
      var forceAmount, t;
      t = frameTime - prevT;
      prevT = frameTime;
      forceAmount = 0.0008;
      env.controllable.kick(keysState.up * forceAmount, keysState.down * forceAmount, keysState.left * forceAmount, keysState.right * forceAmount);
      env.nextTick(t);
      if (obj.pos.y > H) {
        obj.pos.y = H;
      }
      canvas.attr({
        width: W,
        height: H
      });
      draw(ctx, env);
      return requestAnimFrame(function() {
        return runOnce(now());
      });
    };
    return runOnce(prevT);
  };

  draw = function(ctx, env) {
    var i, len, obj, ref, results, velocity;
    ref = env.objects;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      obj = ref[i];
      ctx.beginPath();
      ctx.moveTo(obj.pos.x, obj.pos.y);
      velocity = obj.velocity.clone();
      velocity.setAmount(velocity.getAmount() * 2000);
      ctx.lineTo(obj.pos.x + velocity.x, obj.pos.y + velocity.y);
      ctx.strokeStyle = 'red';
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(obj.pos.x, obj.pos.y, obj.mass, 0, 2 * Math.PI, true);
      ctx.closePath();
      results.push(ctx.fill());
    }
    return results;
  };

  mainLoop();

}).call(this);
