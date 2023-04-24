# 概要
このライブラリは、Google Apps Script用の日本国特許庁の試行APIを利用するためのライブラリです。
  
このライブラリは、日本国特許庁の試行APIを呼び出すための関数を提供し、Google Apps Scriptから容易に利用できるようにします。    
試行APIの利用には、事前に登録が必要です。  

日本国特許庁の試行APIは、特許情報の検索や取得を行うためのAPIであり、RESTfulなAPI仕様に従っています。  
主な機能として、以下のものが含まれます。
- 特許情報の検索：キーワード、公開番号、出願番号、出願人名などを指定して、特許情報を検索します。
- 特許情報の取得：特定の特許番号に対応する特許情報を取得します。

詳細は特許庁HPの[通達](https://www.jpo.go.jp/system/laws/sesaku/data/api-provision.html)をご覧ください。  


# インストール方法
Google Apps Script用のライブラリを追加する手順は以下の通りです。

1. Google Apps Scriptを開き、ライブラリを使用するプロジェクトを開きます。
2. メニューバーから「リソース」→「ライブラリ…」をクリックします。
3. 「ライブラリを追加」ウィンドウが表示されるので、スクリプトIDを入力します。
4. スクリプトIDが正しく入力されていることを確認し、「追加」をクリックします。
5. 「バージョンを選択」ウィンドウが表示されるので、使用するバージョンを選択します。
6. 選択したバージョンが正しく表示されていることを確認し、「保存」をクリックします。
7. ライブラリが正常に追加されたことを確認するために、スクリプトエディタでライブラリを使用するコードを記述します。
8. 以上の手順に従うことで、Google Apps Script用のライブラリを追加することができます。

# ライブラリのID
12Xp0oql4p0uUdGKLas3u_IKuH84ENAmoyliuROKhmCsp-pYqZf9rzInM

# 初期設定
スクリプトプロパティに所定の情報を格納してください。  
スクリプトプロパティの設定方法は、GASの[公式ドキュメント](https://developers.google.com/apps-script/guides/properties)を参照してください。
  
## 必要な情報
* USER_ID  
  特許庁から指定されたユーザIDを格納してください。

* USER_PASSWORD  
  特許庁から指定されたパスワードを格納してください。

* AUTH_ENDPOINT  
  特許庁から認証用エンドポイントを格納してください。

## 注意
認証用のエンドポイントは、公開禁止とのことでした。  
セキュリティの都合とは思いますが、若干面倒ですね、、、。

# 使い方
ライブラリの追加方法は[こちら](https://developers.google.com/apps-script/guides/libraries)をご参照ください。

## インスタンスの宣言
```javascript:declared_instance.js
const jpo = new JapanPatentOfficeBetaApi.JapanPatentOfficeBetaApi();
```

## 認証・再認証
```javascript:auth.js
// 認証
jpo.auth();

// 再認証
jpo.tokenRefresh();
```

## 文献情報取得
```javascript:search_documents.js
// 審査状況（特願xxxx-xxxxxx）形式
var progressInfo = jpo.getProgress("特願2016-172346");

// 審査状況（xxxxxxxxxx）形式
var progressInfo = jpo.getProgress("2016172346");

// 審査状況（優先権基礎情報、原出願情報、分割出願群情報を含まない）
var simpleProgressInfo = jpo.getSimpleProgress("特願2016-172346");

// 分割出願の情報
var divisionalInfo = jpo.getDivisionalInfomations("特願2016-172346");

// 優先権情報
var priorityInfo = jpo.getPriorityInformations("特願2016-172346");

// 引用文献の情報を取得
var citationInfo = jpo.getCitationInformations("特願2016-172346");

// 登録情報を取得
var registrationInfo = jpo.getRegistrationInformations("特願2016-172346");
```

## 出願人名・コード取得
```javascript:search_attorney.js
// 出願人コードから出願人名を特定
var attorneyName = jpo.getAttorneyName("509216267");

// 出願人名から出願人コードを特定（完全一致）
var attorneyCode = jpo.getAttorneyCode("株式会社エース・マーチャンダイズ");
```

## 番号検索
```javascript:search_cease_number.js
// 出願番号から公開公報番号・特許番号を取得
var caseNumber = jpo.getCaseNumberFromApplicationNumber("特願2016-172346");

// 公開公報番号から出願番号・特許番号を取得
var caseNumber = jpo.getCaseNumberFromPublicationNumber("特開2018-035483");

// 特許番号から出願番号・公開公報番号を取得
var caseNumber = jpo.getCaseNumberFromRegistrationNumber("特許6366202");
```

## 実態ファイル取得
Google Driveに保存されます。  
そのため、Google Driveの操作権限が必要です。
```javascript:get_files.js
// 申請系書類取得
jpo.getOpinionAndAmendmentDocuments("特願2016-172346");

// 拒絶理由通知・拒絶査定ファイルを取得
jpo.getRefusalReasonAndDecisionDocuments("特願2016-172346")

// 拒絶理由通知ファイルを取得
jpo.getRefusalReasonDocuments("特願2016-172346");
```
