class JapanPatentOfficeBetaApi {
  /**
   * @param {string} accessToken - APIから返却されたAccessToken
   * @param {datetime} accessTokenExpires - APIから返却されたAccessTokenの有効期限
   * @param {string} refreshTokne - APIから返却されたRefreshToken
   * @param {datetime} refreshTokenExprires - APIから返却されたRefreshTokenの有効期限
   */
  constructor (authEndpoint, accessToken, accessTokenExpires, refreshToken, refreshTokenExpires, url) {
    if (authEndpoint == undefined) {
      throw "認証エンドポイントを指定してください！";
    }

    if (url == undefined){
      url ="https://ip-data.jpo.go.jp/"
    }
    this.serverUrl = url;
    this.url = `${this.serverUrl}api/patent/v1/`
    this.authUrl = `${this.serverUrl}/${authEndpoint}`;

    // 引数指定がされた場合の対応
    if (accessToken != undefined && accessToken != "") {
      this.accessToken = accessToken;
    }else{
      this.accessToken = "";
    }

    if (accessTokenExpires != undefined && accessTokenExpires != "") {
      this.accessTokenExpires = accessTokenExpires;
    }else{
      this.accessTokenExpires = "";
    }

    if (refreshToken != undefined && refreshToken != "") {
      this.refreshToken = refreshToken;
    }else{
          this.refreshToken = "";
    }

    if (refreshTokenExpires != undefined && refreshTokenExpires != "") {
      this.refreshTokenExpires = refreshTokenExpires;
    }else {
      this.refreshTokenExpires = "";
    }
  }

  /**
   * ユーザID及びパスワードで認証を行う
   * 
   * @param {string} uid - 特許庁から指定されたユーザ名
   * @param {string} upass - 特許庁から指定されたパスワード
   * @return {boolean} - 認証の成否を示す真偽値
   */
  auth (uid, upass) {
    this.uid = uid;
    this.upass = upass;

    // 試行環境APIには1日あたりの接続上限が設定されているので、不必要な接続はしないようにする。
    if (this.accessToken != undefined && this.accessTokenExpires > new Date()){
      // ACCESS_TOKENが生きているケース
      Logger.log("既存TOKENを使用します。")
      return true
    }

    const authInfo = {
      "grant_type" : "password",
      "username" : this.uid,
      "password" : this.upass
    };

    const options = {
      "method" : "post",
      "contentType" : "application/x-www-form-urlencoded",
      "payload" : authInfo,
      "muteHttpExceptions" : true
    };

    var now = new Date();

    var r = UrlFetchApp.fetch(`${this.authUrl}`, options);

    if (r.getResponseCode() != 200) {
      Logger.log(r);
      Logger.log(options)
      return false;
    }

    var response = JSON.parse(r);

    this.accessToken = response["access_token"];  // 認証後1時間で無効化。 refresh_tokenを使うことで再取得可能。
    this.refreshToken = response["refresh_token"];  // 認証後8時間で無効化。 refresh_tokenを使うことで再取得可能。
 
    this.accessTokenExpires = new Date(now.getTime() + response["expires_in"] * 1000);
    this.refreshTokenExpires = new Date(now.getTime() + response["refresh_expires_in"] * 1000);

    return true;
  }

  /**refresh_tokenでaccess_tokenを更新する
   * 
   * @return {boolean} - 認証の成否を示す真偽値
   */
  tokenRefresh () {
    // 試行環境APIは1日あたりの接続上限が設定されているので、不必要な接続はしないようにする。
    if (this.accessToken != undefined && this.accessTokenExpires > new Date()) {
      // ACCESS_TOKENが生きているケース
      return true;
    } else if (this.tokenRefresh == undefined) {
      // そもそもREFRESH_TOKENが無いケース
      return false;
    } else if (this.refreshTokenExpires < new Date()) {
      // REFRESH_TOKENが期限切れの場合
      return false;
    }

    const authInfo = {
      "grant_type" : "refresh_token",
      "refresh_token" : refreshToken
    }

    const options = {
      "method" : "post",
      "contentType" : "application/x-www-form-urlencoded",
      "payload" : authInfo,
      "muteHttpExceptions" : true

    }
    
    var r = UrlFetchApp.fetch(`${this.authUrl}`, options);

    if (r.getResponseCode() != 200) {
      return false;
    }

    var response = JSON.parse(r);
    
    this.accessToken = response["access_token"];  // 認証後1時間で無効化。 refresh_tokenを使うことで再取得可能。
    this.refreshToken = response["refresh_token"];  // 認証後8時間で無効化。 refresh_tokenを使うことで再取得可能。
    // this.accessTokenExpires = ;
    // this.refreshTokenExpires = response["refresh_expires_in"];

    this.accessTokenExpires = new Date(now.getTime() + response["expires_in"] * 1000);
    this.refreshTokenExpires = new Date(now.getTime() + response["refresh_expires_in"] * 1000);

    return true;
  }

  /**出願番号に「特願」や「-」が入っていた場合に整形する
   * 
   * @param {string} applicationNumber - 特許の出願番号（特願などの文言あり）
   * @return {string} 特許の出願番号から数字部分のみを抽出した文字列
   */
  FormatApplicationNumber (applicationNumber) {
    if (applicationNumber.length == 10){
      // OKケース
    }else if (applicationNumber.match("-") && applicationNumber.match("特願")) {
      // ハイフン入ってたケース
      applicationNumber = applicationNumber.replace("-", "");
      applicationNumber = applicationNumber.replace("特願", "");
    }else if (applicationNumber.match("-")) {
      // ハイフンだけ入ってたケース
      applicationNumber = applicationNumber.replace("-", "");
    }else{
      // error
      throw "InputNumberError"
    }

    if (applicationNumber.length == 10) {
      return applicationNumber;
    }else{
      throw "InputNumberError"
    }
  }

  /**公開番号に「特開」や「-」が入っていた場合に整形する
   * 
   * @param {string} applicationNumber - 特許の公開番号（特開などの文言あり）
   * @return {string} 特許の公開番号から数字部分のみを抽出した文字列
   */
  FormatPublicationNumber (publicationNumber) {
    if (publicationNumber.length == 10){
      // OKケース
    }else if (publicationNumber.match("-") && publicationNumber.match("特開")) {
      // ハイフン入ってたケース
      publicationNumber = publicationNumber.replace("-", "");
      publicationNumber = publicationNumber.replace("特開", "");
    }else if (publicationNumber.match("-") && publicationNumber.match("特公")) {
      publicationNumber = publicationNumber.replace("-", "");
      publicationNumber = publicationNumber.replace("特公", "");
    }else if (publicationNumber.match("-") && publicationNumber.match("特表")) {
      publicationNumber = publicationNumber.replace("-", "");
      publicationNumber = publicationNumber.replace("特表", "");
    }else if (publicationNumber.match("-")) {
      // ハイフンだけ入ってたケース
      publicationNumber = publicationNumber.replace("-", "");
    }else{
      // error
      throw "InputNumberError"
    }

    if (publicationNumber.length == 10) {
      return publicationNumber;
    }else{
      throw "InputNumberError"
    }
  }

  /**特許番号に「特許」が入っていた場合に整形する
   * 
   * @param {string} applicationNumber - 特許番号（特許などの文言あり）
   * @return {string} 特許番号から数字部分のみを抽出した文字列
   */
  FormatRegistrationNumber (registrationNumber) {
    if (publicationNumber.length == 7){
      // OKケース
    }else if (publicationNumber.match("特許")) {
      // ハイフン入ってたケース
      publicationNumber = publicationNumber.replace("特許", "");
    }else{
      // error
      throw "InputNumberError"
    }

    if (publicationNumber.length == 7) {
      return publicationNumber;
    }else{
      throw "InputNumberError"
    }
  }

  /**指定された特許出願番号に紐づく経過情報の一覧を取得する
   * 
   * @param {string} applicationNumber - 検索対象特許の出願番号
   * @return {} - 
   */
  getProgress (applicationNumber) {

    applicationNumber = this.FormatApplicationNumber(applicationNumber);
    
    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}app_progress/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された特許出願番号に紐づく経過情報（優先権基礎情報、原出願情報、分割出願群情報を含まない）を取得する
   * 
   * @param {string} applicationNumber - 検索対象特許の出願番号
   * @return {} - 
   */
  getSimpleProgress (applicationNumber) {

    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}app_progress_simple/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された特許出願番号に紐づく分割出願情報を取得する。
   * 
   * @param {applicationNumber} - 出願番号
   * @return {} -
   */
  getDivisionalInfomations (applicationNumber) {
    
    pplicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}divisional_app_info/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された特許出願番号に紐づく優先基礎出願情報を取得する
   * 
   * @param {applicationNumber} - 出願番号
   * @return {} -
   */
  getPriorityInformations (applicationNumber) {
    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}priority_right_app_info/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された申請人コードで申請人(出願人・代理人)氏名・名称を取得する
   * 
   * @param {string} attorneyCode - 申請人コード
   * @return {} -
   */
  getAttorneyName (attorneyCode) {
    
    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}applicant_attorney_cd/${attorneyCode}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された申請人氏名・名称を完全一致検索で、申請人(出願人・代理人)コードを取得する
   * 
   * @param {string} attorneyName - 申請人氏名・名称
   * @return {} -
   */
  getAttorneyCode (attorneyName) {
    
    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}applicant_attorney/${attorneyName}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }
  
  /**出願番号に紐づく案件番号を取得する
   * 
   * @param {string} applicationNumber - 出願番号
   * @return {} -
   */
  getCaseNumberFromApplicationNumber (applicationNumber) {
    
    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }
    
    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}case_number_reference/application/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**公開番号に紐づく案件番号を取得する
   * 
   * @param {string} publicationNumber - 公開番号
   * @param {} -
   */
  getCaseNumberFromPublicationNumber (publicationNumber) {
    
    publicationNumber = this.FormatPublicationNumber(publicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}case_number_reference/publication/${publicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**登録番号に紐づく案件番号を取得する
   * 
   * @param {string} registrationNumber - 登録番号
   * @return {} - 
   */
  getCaseNumberFromRegistrationNumber (registrationNumber) {
    
    registrationNumber = this.FormatRegistrationNumber(registrationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}case_number_reference/registration/${registrationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された特許出願番号に対応する実体審査における特許申請書類の実体ファイル（意見書・手続補正書）のZIPファイルをダウンロードする
   * 
   * @param {string} applicationNumber - 出願番号
   * @return {} -
   */
  getOpinionAndAmendmentDocuments (applicationNumber, saveInGoogleDrive=true) {

    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}app_doc_cont_opinion_amendment/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    // 
    if (saveInGoogleDrive){
      DriveApp.createFile(r.getBlob());
      
      return true;
    }else{
      var response = JSON.parse(r);

      return response;
    }
  }

  /**指定された特許出願番号に対応する実体審査における発送書類の実体ファイル（拒絶理由通知書、特許査定、拒絶査定、補正の却下の決定）のZIPファイルをダウンロードする
   * 
   * @param {string} applicationNumber - 出願番号
   * @return {} -
   */
  getRefusalReasonAndDecisionDocuments (applicationNumber) {

    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}app_doc_cont_refusal_reason_decision/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された特許出願番号に対応する拒絶理由通知書のZIPファイルをダウンロードする
   * 
   * @param {string} applicationNumber - 出願番号
   * @return {} -
   */
  getRefusalReasonDocuments (applicationNumber) {

    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}app_doc_cont_refusal_reason/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された特許出願番号に紐づく引用文献情報を取得する
   * 
   * @param {string} applicationNumber - 出願番号
   * @return {} -
   */
  getCitationInformations (applicationNumber) {

    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}cite_doc_info/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }

  /**指定された特許出願番号に紐づく登録情報を取得する
   * 
   * @param {string} applicationNumber - 出願番号
   * @return {} -
   */
  getReistrationInformations (applicationNumber) {
    applicationNumber = this.FormatApplicationNumber(applicationNumber);

    const accessHeaders = {
      "Authorization" : `Bearer ${this.accessToken}`
    }

    const options = {
      "headers" : accessHeaders,
      "muteHttpExceptions" : true
    }

    var r = UrlFetchApp.fetch(`${this.url}registration_info/${applicationNumber}`, options);

    if (r.getResponseCode() == 401) {
      throw "Token Expired ";
    }else if (r.getResponseCode() != 200) {
      return undefined;
    }

    var response = JSON.parse(r);

    return response;
  }
}

this.api = JapanPatentOfficeBetaApi;