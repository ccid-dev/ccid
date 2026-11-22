/**
 * 보내주신 flow cursor(원본 flow-cursor.js, 레포에는 없음)의 셰이더 — 원본에서 자동으로 꺼내 글자 그대로 옮겼습니다.
 * 구: SPHERE_VERTEX · SPHERE_FRAGMENT / 둘레 빛번짐: HAZE_VERTEX · HAZE_FRAGMENT (쓰는 곳: flow-orb.ts)
 */

export const SPHERE_VERTEX = /* glsl */ `

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    
`;

export const SPHERE_FRAGMENT = /* glsl */ `

      precision highp float;
      uniform float time;
      uniform vec3 lightDir;
      uniform vec3 ringDir;
      uniform float boost;
      uniform float globalAlpha;
      uniform float paletteMix;
      uniform float intensityBoost;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform vec3 uColorWarm;
      uniform vec3 uRim;
      uniform float uAreaA;
      uniform float uAreaB;
      uniform float uAreaC;
      uniform float uAreaWarm;
      uniform float uAreaRim;
      uniform float uRandom;
      uniform float uSoftness;
      uniform float uBrightness;
      uniform float uGlow;
      uniform float uFlowSpeed;
      uniform float uFlowScale;
      uniform float uStyle;
      varying vec2 vUv;
      varying vec3 vNormal;
      float hash(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y);}      
      float n2(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); float a=hash(i); float b=hash(i+vec2(1.0,0.0)); float c=hash(i+vec2(0.0,1.0)); float d=hash(i+vec2(1.0,1.0)); vec2 u=f*f*(3.0-2.0*f); return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);}      
      float noise(vec2 p) { return sin(p.x) * cos(p.y) + sin(p.x*2.0)*cos(p.y*2.0)*0.5; }
      float elasticWave(float x, float frequency, float amplitude){ float wave=sin(x*frequency)*amplitude; float decay=exp(-x*0.05); float bounce=sin(x*frequency*2.0)*amplitude*0.3; return (wave+bounce)*decay; }
      float breathingMotion(float time){ float slow=sin(time*0.3)*0.15; float fast=sin(time*0.8)*0.08; float deep=sin(time*0.15)*0.25; return slow+fast+deep; }
      float bumpMove(float c,float w,float f){ float d0=abs(f-(c-1.0)); float d1=abs(f-c); float d2=abs(f-(c+1.0)); float d=min(d0,min(d1,d2)); float aa=fwidth(f)*1.2; return smoothstep(w+aa,0.0+aa,d);}      
      vec3 bandWeights(float f){
        float width=mix(0.2, 0.58, clamp(uSoftness, 0.0, 1.0));
        float j=clamp(uRandom, 0.0, 1.0) * 0.22;
        float y=bumpMove(0.18 + j * (n2(vec2(f, 0.4)) - 0.5), width, f);
        float p=bumpMove(0.52 + j * (n2(vec2(f, 1.8)) - 0.5), width, f);
        float u=bumpMove(0.86 + j * (n2(vec2(f, 3.1)) - 0.5), width, f);
        return vec3(y,p,u);
      }      
      float softBlur(float x, float strength) {
        return exp(-x * x / strength);
      }
      void main(){
        vec3 N=normalize(vNormal); vec3 L=normalize(lightDir); vec2 p0=vUv-0.5; float r=length(p0);
        float ft=time*clamp(uFlowSpeed/0.16, 0.0, 8.0);
        float rnd=clamp(uRandom, 0.0, 1.0);
        float soft=clamp(uSoftness, 0.0, 1.0);
        vec2 p=p0+(vec2(n2(vUv*mix(1.5, 4.8, rnd)+ft*0.15), n2(vUv*mix(1.5, 4.8, rnd)+ft*0.15+6.2))-0.5)*rnd*0.72;
        // boost가 0일 때는 breathing motion을 매우 작게 (거의 정지)
        float breathing=breathingMotion(ft * mix(0.08, 0.32, boost));
        r=r*(1.0+breathing*mix(0.02, 0.14, boost));
        float topness=clamp(dot(N,normalize(ringDir))*0.5+0.5,0.0,1.0);
        topness=clamp(topness+(n2(vUv*mix(1.3, 5.4, rnd)+ft*0.22)-0.5)*rnd*0.95, 0.0, 1.0);
        vec3 colTop=uColorA;
        vec3 colBot=uColorB;
        vec3 colSide=uColorC;
        vec3 colWarm=uColorWarm;
        float aA=clamp(uAreaA, 0.0, 1.0);
        float aB=clamp(uAreaB, 0.0, 1.0);
        float aC=clamp(uAreaC, 0.0, 1.0);
        float aW=clamp(uAreaWarm, 0.0, 1.0);
        float aR=clamp(uAreaRim, 0.0, 1.0);
        float topW=smoothstep(0.04, 0.84, topness)*aA;
        float botW=smoothstep(0.04, 0.84, 1.0-topness)*aB;
        float sideW=smoothstep(0.0, 0.62, 1.0-abs(topness*2.0-1.0))*aC;
        float warmW=smoothstep(0.34, 0.04, length(p))*aW;
        float melt=soft*0.72;
        topW=mix(topW, aA*0.55, melt);
        botW=mix(botW, aB*0.55, melt);
        sideW=mix(sideW, aC*0.55, melt);
        warmW=mix(warmW, aW*0.55, melt);
        float pool=max(topW+botW+sideW+warmW, 0.001);
        vec3 base=(colTop*topW + colBot*botW + colSide*sideW + colWarm*warmW)/pool;
        vec3 paletteGradient=mix(colSide, colBot, smoothstep(-0.2, 0.52, p.y));
        base=mix(base, paletteGradient, paletteMix * 0.6 * aC);
        float centerGlow = smoothstep(0.32, 0.05, length(p));
        base = mix(base, colWarm, centerGlow * 0.48 * aW);
        float bottomFactor = 1.0 - smoothstep(-0.45, 0.05, p.y);
        base = mix(base, colBot, bottomFactor * 0.55 * aB);
        // boost가 0일 때는 phase 변화를 매우 느리게 (거의 정지)
        float loopSec=mix(50.0, 10.0, boost); float loopT=mod(ft,loopSec)/loopSec; float phase=-loopT;
        float boostFactor = 1.0 + boost * 2.6;
        // boost가 0일 때는 wave 속도를 거의 0으로
        float waveSpeed = mix(0.08, 3.0, boost);
        float waveFreq  = mix(2.0, 18.0, boost) * max(uFlowScale, 0.15);
        // boost가 0일 때는 pulse를 거의 정지
        float pulse = 0.5 + 0.5 * sin(ft * mix(0.08, 1.05, boost));
        pulse = smoothstep(0.25, 0.9, pulse) * (0.1 + boost * 0.9);
        float wave0 = sin(waveFreq * r - waveSpeed * ft);
        float wave1 = sin((waveFreq * 1.6) * r - (waveSpeed * 1.2) * ft);
        float wave2 = sin((waveFreq * 2.3) * r - (waveSpeed * 1.6) * ft + 1.2);
        float radialEnv = smoothstep(0.0, 0.9, r);
        // boost가 0일 때는 outwardWave를 거의 0으로
        float outwardWave = radialEnv * pulse * (
          mix(0.01, 0.28, boost) * wave0 +
          mix(0.006, 0.18, boost) * wave1 +
          mix(0.004, 0.12, boost) * wave2
        );
        // boost가 0일 때는 ripple과 elastic을 매우 작게
        float rippleScale=max(uFlowScale, 0.15);
        float ripple1=noise(vUv*3.0*rippleScale+ft*mix(0.05, 0.26, boost))*mix(0.002, 0.02, boost)*boostFactor; float ripple2=noise(vUv*5.0*rippleScale+ft*mix(0.04, 0.2, boost))*mix(0.001, 0.012, boost)*boostFactor; float ripple3=noise(vUv*7.0*rippleScale+ft*mix(0.08, 0.4, boost))*mix(0.0008, 0.008, boost)*boostFactor; float totalRipple=ripple1+ripple2+ripple3;
        float elastic1=elasticWave(topness*2.0+ft*mix(0.08, 0.32, boost),3.0,mix(0.008, 0.05, boost)*boostFactor); float elastic2=elasticWave(topness*3.0+ft*mix(0.12, 0.52, boost),2.1,mix(0.006, 0.036, boost)*boostFactor); float totalElastic=elastic1+elastic2;
        float blurAmount=mix(0.008, 0.08, soft); float f1=topness*1.8+phase+totalRipple+totalElastic + outwardWave; float f2=topness*1.8+phase+blurAmount+totalRipple*0.8+totalElastic*0.6 + outwardWave * 0.72; float f3=topness*1.8+phase+(blurAmount*1.5)+totalRipple*0.6+totalElastic*0.4 + outwardWave * 0.45;
        // boost가 0일 때는 perturb와 wobble을 매우 작게
        float perturb=mix(0.01, 0.32, rnd)*n2(vUv*mix(1.5, 4.6, rnd)+ft*mix(0.01, 0.22, rnd)); vec3 w1=bandWeights(f1+perturb); vec3 w2=bandWeights(f2+perturb*0.8); vec3 w3=bandWeights(f3+perturb*0.6);
        float wobble1=0.995+mix(0.0003, 0.0025, boost)*n2(vUv*2.2+ft*mix(0.01, 0.06, boost)); float wobble2=0.995+mix(0.0003, 0.0025, boost)*n2(vUv*2.2+ft*mix(0.01, 0.06, boost)+1.7); float wobble3=0.995+mix(0.0003, 0.0025, boost)*n2(vUv*2.2+ft*mix(0.01, 0.06, boost)+3.1); w1*=wobble1; w2*=wobble2; w3*=wobble3;
         // boost가 높을 때 퍼플/핑크를 더 많이 포함하도록 컬러 팔레트 조정
         vec3 cY=colTop;
         vec3 cP=colSide;
         vec3 cU=colBot;
         // boost가 높을 때 핑크와 퍼플 강화
         vec3 cPink=mix(colWarm, uRim, 0.4);
         vec3 cPurple=mix(colBot, uRim, 0.28);
         // paletteMix와 boost에 따라 퍼플/핑크를 더 많이 혼합
         float colorMix=paletteMix + boost * 0.4;
         cP=mix(cP, mix(cPink, cPurple, 0.6), colorMix * 0.7);
         cU=mix(cU, mix(cPurple, cPink, 0.4), colorMix * 0.8);
         vec3 areaGain=vec3(aA, aC, aB);
         w1*=vec3(0.24,1.08,1.02)*areaGain; w2*=vec3(0.24,1.08,1.02)*areaGain; w3*=vec3(0.24,1.08,1.02)*areaGain;
         vec3 flowColor1=cY*w1.x + cP*w1.y + cU*w1.z; vec3 flowColor2=cY*w2.x + cP*w2.y + cU*w2.z; vec3 flowColor3=cY*w3.x + cP*w3.y + cU*w3.z; vec3 flowColor=(0.5*flowColor1 + 0.35*flowColor2 + 0.15*flowColor3);
         float mask1=clamp(w1.x+w1.y+w1.z,0.0,1.0); float mask2=clamp(w2.x+w2.y+w2.z,0.0,1.0); float mask3=clamp(w3.x+w3.y+w3.z,0.0,1.0); float flowMaskAvg=clamp((0.5*mask1 + 0.35*mask2 + 0.15*mask3),0.0,1.0);
        vec3 lit=base;
        // boost가 0일 때는 flowColor 혼합을 매우 작게 (거의 정지)
        lit=mix(lit,flowColor,flowMaskAvg*mix(0.15,0.68,boost));
        // ripple과 elastic에도 퍼플/핑크 강화, boost가 0일 때는 매우 작게
        vec3 rippleBase=colSide;
        vec3 ripplePink=mix(colWarm, uRim, 0.35);
        vec3 ripplePurple=colBot;
        vec3 rippleAlt=mix(ripplePink, ripplePurple, 0.6);
        vec3 rippleColor=mix(rippleBase, mix(rippleAlt, colBot, 0.5), colorMix * 0.75)*totalRipple*mix(0.08,0.68,boost);
        vec3 elasticBase=mix(colBot, uRim, 0.25);
        vec3 elasticPink=mix(colWarm, colBot, 0.45);
        vec3 elasticPurple=colBot;
        vec3 elasticAlt=mix(elasticPink, elasticPurple, 0.5);
        vec3 elasticColor=mix(elasticBase, mix(elasticAlt, colSide, 0.5), colorMix * 0.7)*totalElastic*mix(0.05,0.52,boost);
        lit+=rippleColor+elasticColor;
        lit = mix(lit, colSide, smoothstep(0.0,0.45,length(p))*0.18*aC);
        lit = mix(lit, colBot, bottomFactor * 0.32 * aB);
        lit = mix(lit, mix(colWarm, mix(colSide, colBot, 0.42), paletteMix), centerGlow * 0.62 * aW);
        vec3 V=vec3(0.0,0.0,1.0); 
        float fres=pow(1.0 - max(dot(N,V),0.0), 2.2);
        vec3 rimBase=uRim;
        vec3 rimAlt=mix(uRim, colBot, 0.45);
        // boost가 높을 때 퍼플/핑크 강화, boost가 0일 때는 매우 작게
        vec3 rimGlow=mix(rimBase, mix(rimAlt, colBot, 0.5), colorMix * 0.8)*fres*mix(0.18,0.68,boost)*mix(0.2, 1.7, aR);
        float softHalo=smoothstep(0.42, 0.16, r)*0.12;
        vec3 glow=mix(uRim, mix(colWarm, colBot, 0.5), colorMix * 0.7);
        glow=mix(glow, mix(uRim, colSide, paletteMix), 1.0 - boost * 0.5);
        glow=rimGlow + glow*softHalo;
        float glowAmt=mix(0.25, 1.9, clamp(uGlow / 2.2, 0.0, 1.0));
        lit+=glow*glowAmt;
        vec3 undersideColor=mix(colSide, mix(colWarm, colBot, 0.4), colorMix * 0.6);
        lit+=mix(colSide, undersideColor, boost * 0.4)*(1.0-topness)*mix(0.04,0.28,boost)*aB;
        vec3 highlightColor=mix(colBot, colWarm, 0.4);
        lit+=mix(colWarm, mix(colBot, highlightColor, boost * 0.5), paletteMix * mix(0.58,0.75,boost)) * centerGlow * mix(0.08,0.38,boost) * aW;
        float glass=step(0.5, uStyle) * (1.0 - step(1.5, uStyle));
        float liquid=step(1.5, uStyle);
        lit=mix(lit, uRim, fres * 0.26 * glass);
        lit=mix(lit, flowColor, flowMaskAvg * 0.3 * liquid);
        vec3 gray=vec3(dot(lit,vec3(0.299,0.587,0.114)));
        float loopPhase = 0.5 + 0.5 * sin(6.28318530718 * ft / 7.0);
        float baseSat = 1.0 + 0.85 * loopPhase;
        float baseBrightness = 1.0 + 0.14 * loopPhase;
        float baseContrast = 1.0 + 0.32 * loopPhase;
        float intensity = intensityBoost;
        // boost가 높을 때(active 상태) 채도를 추가로 낮추기 (너무 쨍함 방지)
        float boostSatReduction = 1.0 - boost * 0.18;
        // 채도를 더 낮추고, intensity 증가 시 채도 변화를 완만하게, boost가 높을 때 추가 감소
        float sat = mix(baseSat * 0.75 * 0.75, baseSat * (1.0 + 0.5 * intensity) * 0.65 * boostSatReduction, intensity);
        lit = mix(gray, lit, sat);
        // brightness 증가 폭을 줄임 (0.48 -> 0.15로 줄임)
        float brightness = mix(baseBrightness * 1.08, baseBrightness * (1.0 + 0.15 * intensity), intensity);
        lit *= brightness;
        // contrast 증가 폭을 줄임 (0.85 -> 0.25로 줄임)
        float contrast = mix(baseContrast * 0.92, baseContrast * (1.0 + 0.25 * intensity), intensity);
        lit = (lit - 0.5) * contrast + 0.5;
        lit=pow(lit,vec3(0.92)); lit*=mix(1.0,1.05,boost); lit=mix(lit,vec3(1.0),0.02); lit*=uBrightness; lit=clamp(lit,0.0,1.0);
        float edgeBase = smoothstep(0.56, 0.32, r);
        float edgeGlow = softBlur(r - 0.4, 0.15);
        float edgeFeather = edgeBase * (1.0 + edgeGlow * 0.3);
        float alpha = 0.88 * edgeFeather + fres * 0.15;
        alpha = alpha * (1.0 - softBlur(r - 0.45, 0.2) * 0.3);
        alpha = clamp(alpha, 0.0, 0.95);
        gl_FragColor=vec4(lit,alpha * globalAlpha);
      }
    
`;

export const HAZE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const HAZE_FRAGMENT = /* glsl */ `
varying vec2 vUv;
uniform vec3 uColor;
uniform float uAmount;
uniform float uSpread;
uniform float uFade;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = exp(-d * d * uSpread) * uAmount * uFade;
  a *= smoothstep(1.0, 0.55, d);
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;
