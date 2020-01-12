var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

// schema
var userSchema = mongoose.Schema({
  username:{
    type:String,
    required:[true,'Username is required!'],
    match:[/^.{4,12}$/,'Should be 4-12 characters!'],
    trim:true,
    unique:true
  },
  password:{
    type:String,
    required:[true,'Password is required!'],
    select:false // false로 지정시 DB에서 해당 모델을 읽어 올때 해당 항목 값을 읽어오지 않음 
  },
  name:{
    type:String,
    required:[true,'Name is required!'],
    match:[/^.{4,12}$/,'Should be 4-12 characters!'],
    trim:true
  },
  email:{
    type:String,
    match:[/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,'Should be a vaild email address!'],
    trim:true
  }
},{
  toObject:{virtuals:true}
});

// virtuals, DB에 저장되는 값 이외의 항목이 필요할 때 만듬, 즉 저장할 필요는 없지만 회원가입, 정보 수정을 위해 필요
userSchema.virtual('passwordConfirmation')
  .get(function(){ return this._passwordConfirmation; })
  .set(function(value){ this._passwordConfirmation=value; });

userSchema.virtual('originalPassword')
  .get(function(){ return this._originalPassword; })
  .set(function(value){ this._originalPassword=value; });

userSchema.virtual('currentPassword')
  .get(function(){ return this._currentPassword; })
  .set(function(value){ this._currentPassword=value; });

userSchema.virtual('newPassword')
  .get(function(){ return this._newPassword; })
  .set(function(value){ this._newPassword=value; });

// password validation 패스워드를 DB에 생성, 수정하기 전에 값이 유효한지 확인하는 코드
var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
var passwordRegexErrorMessage = 'Should be minimum 8 characters of alphabet and number combination!';
userSchema.path('password').validate(function(v) {
  var user = this; 

  // create user
  if(user.isNew){ // 해당 모델이 생성 되는 경우 true, false 리턴함 이 항목을 통해 회원가입 단계인지 회원 정보 수정 단계인지 파악
    if(!user.passwordConfirmation){
      user.invalidate('passwordConfirmation', 'Password Confirmation is required.');
    }

    if(!passwordRegex.test(user.password)){
      user.invalidate('password', passwordRegexErrorMessage);
    }
    else if(user.password !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }

  // update user
  if(!user.isNew){ // 회원 정보 수정의 경우 current pw값이 없는 경우와 current pw값이 original pw값과 다른 경우, new pw 값과 pw confirmation이 다른 경우 invalidate함
    if(!user.currentPassword){
      user.invalidate('currentPassword', 'Current Password is required!');
    }
    else if(!bcrypt.compareSync(user.currentPassword, user.originalPassword)){ // compareSync를 사용하여 저장된 해쉬와 입력받은 pw 해쉬와 일치하는지 확인, user.currentpwd는 text여서 hash로 변환 후 확인
      user.invalidate('currentPassword', 'Current Password is invalid!');
    }

    if(user.newPassword && !passwordRegex.test(user.newPassword)){
      user.invalidate("newPassword", passwordRegexErrorMessage);
    }
    else if(user.newPassword !== user.passwordConfirmation) {
      user.invalidate('passwordConfirmation', 'Password Confirmation does not matched!');
    }
  }
});

// hash password schema.pre는 첫번째 파라미터로 설정 된 이벤트가 발생전에 먼저 콜백 함수 실행
userSchema.pre('save', function (next){ // save 이벤트는 model.create, model.save 함수 실행 시 발생하는 이벤트, user를 생성하거나 수정한 뒤 save 함수를 실행 할 때 위의 콜백 함수가 호출
  var user = this;
  if(!user.isModified('password')){
    return next();
  }
  else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});

// model methods
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};

// model & export
var User = mongoose.model('user',userSchema);
module.exports = User;
