# プロジェクト概要
- 今プロジェクトでは、OSS WikiツールのGrowiで閲覧中の記事のフロントマター情報を画面右のside barにパネル形式で表示するプラグインを開発します
- Growiの画面遷移の検出にはpageContext.ts、growiNavagation.tsを使用します
- client-entry.tsxでhandlePageChangeが呼ばれたら、閲覧中のページのpageIdとrevisionId(あれば）を用いて、apiを用いてページの記事を取得
- もしも記事の本文にフロントマターが存在すれば、画面右のサイドバーにパネルコンポーネントを追加し、そこにFront Matterを表形式 またはYAML形式を選択して表示できるようにします（トグルさせるイメージです）
- 表形式ではYAMLをパースしてうまく表現する必要があります
- 対応したいYAML形式は後でまとめています
- ネストを表で表現する工夫が必要です
    うまく表現できない場合は、生のYAMLを表示するのでも仕方がないかもしれません


# 対応したいYAML形式
## Scalar types
n1: 1            # integer          
n2: 1.234        # float      

s1: 'abc'        # string        
s2: "abc"        # string           
s3: abc          # string           

b: false         # boolean type 

d: 2015-04-05    # date type


## Sequence
- Mark McGwire
- Sammy Sosa
- Ken Griffey

## Mapping
hr:  65       # Home runs
avg: 0.278    # Batting average
rbi: 147      # Runs Batted In

## Mapping to Sequence
attributes:
  - a1
  - a2
methods: [getter, setter]

## Sequence tof Mappings
children:
  - name: Jimmy Smith
    age: 15
  - name: Jimmy Smith
    age: 15
  -
    name: Sammy Sosa
    age: 12

## Sequence of Sequences
my_sequences:
  - [1, 2, 3]
  - [4, 5, 6]
  -  
    - 7
    - 8
    - 9
    - 0 

## Mapping of Mappings
Mark McGwire: {hr: 65, avg: 0.278}
Sammy Sosa: {
    hr: 63,
    avg: 0.288
  }

## Nested Collections
Jack:
  id: 1
  name: Franc
  salary: 25000
  hobby:
    - a
    - b
  location: {country: "A", city: "A-A"}

# 使用するAPI
- pageContextで使用できるのはpageIdおよびrevisionIdです。
- 更新履歴から過去の記事を見ているときは、過去の記事のフロントマターを表示します。
- revisionIdがnullの場合は最新の記事のフロントマターを表示します
- 通常ページ: GET /_api/v3/page?pageId=<pageId>
   → json.page.revision.body
- リビジョン指定: GET /_api/v3/revisions/<revisionId>?pageId=<pageId>
   → json.revision.body

# sidebarの挿入場所（マウントポイント）について
マウントポイントの見つけ方や指定方法がわかりません。
どのように調査するとよいか調べ方を教えてください。
growiFacadeというオブジェクトがありreactでreactが取得できたりしますが、それはDOMとは関係がない気がします。
Reactアプリでプラグインがどのように標準のDOMの特定のマウントポイントを取得するのか、ベストプラクティスを提示してください。


# 技術要件
- なるべく無駄な処理は省いてシンプルを目指す
- ReactのベストプラクティスやGrowiのベストプラクティスに従う