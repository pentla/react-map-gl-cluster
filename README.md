# react-map-gl-components

## 概要

[react-map-gl](https://visgl.github.io/react-map-gl/) を使った際、geocodingやclusteringを使いたくなることがあると思います。
ただ現状TypeScriptに対応したコンポーネントはなかったので、すでにあるサンプルのTypeScriptの補完がある程度効くコンポーネント群です。


## cluster.tsx

引用元: [Integrating Mapbox's Supercluster with react-map-gl](https://github.com/visgl/react-map-gl/issues/507#issuecomment-424860068)

変更点:

- TypeScriptでPropsを定義できるように
- React hooksを使った形式に変更

## geocoding.tsx

引用元: [SamSamskies/react-map-gl-geocoder](https://github.com/SamSamskies/react-map-gl-geocoder/blob/master/src/index.js)

変更点

- TypeScriptでPropsを定義できるように
- geocodingをした際の返り値のTypeScript定義を追加
