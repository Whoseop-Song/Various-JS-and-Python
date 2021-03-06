var EUGEN = {};
(function(){
  var CONST = {
        e0: 8.854187817e-12 * 10e10,
        e: 1.602176565e-19,
        Na: 6.0221415e23,
        convertFactor: 10e17,
        PI: Math.PI
      },
      sqrt = Math.sqrt,
      square = function(a) {
        return Math.pow(a, 2);
      },
      distance = function(a,b){
        return sqrt(square(a.x - b.x) + square(a.y - b.y) + square(a.z - b.z));
      },
      point = vectorConstructor("x","y","z");

  function roundToZero(num){
    return roundTo(num, 10e10);
  }

  function roundTo(num, to){
    return Math.round(num * to) / to;
  }

  function getXYZComponents(){
    var cfg = EUGEN.config,
        a = cfg.cellParams.a, b = cfg.cellParams.b, c = cfg.cellParams.c,
        alpha = cfg.cellParams.alpha, beta = cfg.cellParams.beta, gama = cfg.cellParams.gama,
        cos = Math.cos, sin = Math.sin,
        cy = roundToZero(c * (cos(alpha) - cos(beta) * cos(gama)) / sin (gama) );
    return {
        a: point(a,0,0),
        b: point(roundToZero(b * cos(gama)), roundToZero(b * sin(gama)), 0),
        c: point(roundToZero(c * cos(beta)), cy, roundToZero(c * sqrt(square(sin(beta)) - square(cy/c))))
      };
  }

  function combinatorMap(rangeMin, rangeMax, func){
    var arr = [];
    for(var x = rangeMin; x<rangeMax+1; x++){
      for(var y = rangeMin; y<rangeMax+1; y++){
        for(var z = rangeMin; z<rangeMax+1; z++){
          arr.push(func(x,y,z));
        }
      }
    }
    return arr;
  }

  EUGEN.config = {
    ions:[],
    refIonIndex:0,
    cellParams:{}, //a,b,c,alpha,beta,gama
    expRange:1,
    isDebug:false,
    positionType:'relative' //relative/absolue
  };

  //TODO 1 Extract all trigonometry stuff, which is:
  //  - Input: a,b,c, angles,unit cell, expand range
  //  - Returns: List of points with values

  //TODO Make EUGEN calculation function:
  //  - Input: list of points, reference ion (by Index)
  //  - Returns: EUGEN constant

  //TODO Make Function:
  //  - Input: list of points, two points for define plane on one point,
  //      perpendicular to the line between points, and second point shows
  //      plane side, from which points ... blah blah blah
  //  - Returns: list of points from one side of the plane, defined by second point

  EUGEN.makeCalculation = function(){
    var cfg = EUGEN.config,
        refIon = cfg.ions[cfg.refIonIndex],
        abs = Math.abs,
        shiftComps = getXYZComponents(), //put to ajax.
        prefix = CONST.convertFactor *  (CONST.Na * square(CONST.e)) / (4 * CONST.PI * CONST.e0),
        results = [], comulSum = 0, minR = Number.MAX_VALUE,
        count, debugPoints,
        totalWeightedDistance, energy, madelung;

    if(cfg.isDebug){
      console.log("convertFactor *  (Na * square(e)) / (4 * Math.PI * e0) = ", prefix, " ,where");
      console.log({convertFactor:CONST.convertFactor, Na:CONST.Na, square_e:square(CONST.e), e0:CONST.e0});
    }

    for(var growIndex = 0; growIndex < cfg.expRange; growIndex++){
      count = 0, debugPoints = [];

      comulSum += combinatorMap(-growIndex, growIndex, function(j, k, l){
        if(cfg.isDebug){
          count += cfg.ions.length;
        }
        return cfg.ions.map(function(ion, index){
          var isInitialCell = j == 0 && k == 0 && l == 0,
            isRefIonInBaseCell = index == cfg.refIonIndex && isInitialCell,
            notSurfaceCell = growIndex > 0 && abs(j) < growIndex && abs(k) < growIndex && abs(l) < growIndex,
            shiftVector, transIon, r;

          if(isRefIonInBaseCell || notSurfaceCell){
            //Don't count distance for cell not on surface of expanding box. For inner boxes distance already in
            //comulSum variable.
            return 0;
          }

          shiftVector = point(
                j * shiftComps.a.x + k * shiftComps.b.x + l * shiftComps.c.x,
                k * shiftComps.b.y + l * shiftComps.c.y,
                l * shiftComps.c.z);
          transIon = point(
                ion.x + shiftVector.x,
                ion.y + shiftVector.y,
                ion.z + shiftVector.z);
          r = distance(refIon, transIon);

          if(isInitialCell && r < minR){
            minR = r;
          }

          if (r < 0.05){
            return 0;
          }

          if(cfg.isDebug){
            debugPoints.push([roundTo(transIon.x, 10e4), roundTo(transIon.y, 10e4), roundTo(transIon.z, 10e4),
                shiftVector.x + " (" + j + ")", shiftVector.y+ " (" + k + ")", shiftVector.z+ " (" + l + ")",
                index, ion.value, roundTo(r, 10e4),  roundTo(ion.value / r, 10e4)]);
          }

          return ion.value / r;
        }).sum();
      }).sum();

      totalWeightedDistance = refIon.value * comulSum;
      energy = prefix * totalWeightedDistance;
      madelung = minR * totalWeightedDistance;

      if(cfg.isDebug){
        results.push([count, growIndex, energy, debugPoints, roundTo(comulSum, 10e4)]);
      }else{
        results.push([energy, madelung]);
      }

    }

    return results;
  }
}());

