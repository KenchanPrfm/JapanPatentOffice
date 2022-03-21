# JapanPatentOffice
特許庁（JPO）の公開している）特許情報取得APIを使用するためのGASライブラリです。  
APIの利用には、事前に登録が必要です。  
詳細は特許庁HPの[通達](https://www.jpo.go.jp/system/laws/sesaku/data/api-provision.html)をご覧ください。  
  
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
