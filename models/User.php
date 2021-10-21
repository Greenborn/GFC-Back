<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "user".
 *
 * @property int $id
 * @property string|null $username
 * @property string|null $password_hash
 * @property string|null $password_reset_token
 * @property string|null $access_token
 * @property int|null $status
 * @property string|null $created_at
 * @property string|null $updated_at
 * @property int $role_id
 * @property int $profile_id
 *
 * @property Chat-room[] $chat-rooms
 * @property Chat-room[] $chat-rooms0
 * @property Matches[] $matches
 * @property Matches[] $matches0
 * @property Message[] $messages
 * @property Role $role
 * @property Profile $profile
 */
class User extends \yii\db\ActiveRecord implements \yii\web\IdentityInterface
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'user';
    }

    public function behavior(){
      return [
        TimestampBehavior::class,
        [
          'class' => BlameableBehavior::class,
          'updatedByAttribute' => false,
        ]
      ];
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            // [['state_id', 'role_id'], 'required'],
            // [['state_id', 'online', 'role_id'], 'integer'],
            [['username', 'created_at', 'updated_at'], 'string', 'max' => 45],
            [['password_hash', 'password_reset_token'], 'string', 'max' => 255],
            [['access_token'], 'string', 'max' => 128],
            [['role_id'], 'exist', 'skipOnError' => true, 'targetClass' => Role::className(), 'targetAttribute' => ['role_id' => 'id']],
            [['profile_id'], 'exist', 'skipOnError' => true, 'targetClass' => Profile::className(), 'targetAttribute' => ['profile_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'username' => 'Username',
            'password_hash' => 'Password Hash',
            'password_reset_token' => 'Password Reset Token',
            'access_token' => 'Access Token',
            // 'state_id' => 'State ID',
            'created_at' => 'Created At',
            'updated_at' => 'Updated At',
            // 'online' => 'Online',
            'role_id' => 'Role ID',
            'profile_id' => 'Profile ID',
        ];
    }

    /**
     * Gets query for [[Chat-rooms]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getChatRooms()
    {
        return $this->hasMany(ChatRoom::className(), ['user_receiver_id' => 'id'])->inverseOf('userReceiver');
    }

    /**
     * Gets query for [[Chat-rooms0]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getChatRooms0()
    {
        return $this->hasMany(ChatRoom::className(), ['user_sender_id' => 'id'])->inverseOf('userSender');
    }

    /**
     * Gets query for [[Matches]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getMatches()
    {
        return $this->hasMany(Matches::className(), ['user_matched_id' => 'id'])->inverseOf('userMatched');
    }

    /**
     * Gets query for [[Matches0]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getMatches0()
    {
        return $this->hasMany(Matches::className(), ['user_matcher_id' => 'id'])->inverseOf('userMatcher');
    }

    /**
     * Gets query for [[Messages]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getMessages()
    {
        return $this->hasMany(Message::className(), ['user_sender_id' => 'id'])->inverseOf('userSender');
    }

    /**
     * Gets query for [[Role]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getRole()
    {
        return $this->hasOne(Role::className(), ['id' => 'role_id'])->inverseOf('users');
    }

    /**
     * Gets query for [[State]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getState()
    {
        return $this->hasOne(Role::className(), ['id' => 'state_id'])->inverseOf('users0');
    }

    /**
     * Gets query for [[Profile]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfile()
    {
        return $this->hasOne(Profile::className(), ['id' => 'profile_id'])->inverseOf('userProfile');
    }

    public function fields() {
        $fields = parent::fields();

        // quita los campos con información sensible
        unset( $fields['password_hash'],
               $fields['access_token'],
               $fields['password_reset_token'],
             );

        return $fields;
    }

    public function extraFields() {
        return [ 'profile', 'role' ];
    }


    public static function findIdentity($id)  {
        return isset(self::$users[$id]) ? new static(self::$users[$id]) : null;
    }

    public function getId(){
        return $this->id;
    }

    public function getAuthKey() {}

    public function validateAuthKey($authKey) {}

    public static function findIdentityByAccessToken($token, $type = null){
      return static::find()->where(['access_token' => $token])->one();
    }

    public static function findByPasswordResetToken($token)
    {
        if (!static::isPasswordResetTokenValid($token)) {
            return null;
        }

        return static::findOne([
            'password_reset_token' => $token,
            'status' => self::STATUS_ACTIVE,
        ]);
    }

    public static function isPasswordResetTokenValid($token)
    {
        if (empty($token)) {
            return false;
        }

        $timestamp = (int) substr($token, strrpos($token, '_') + 1);
        $expire = Yii::$app->params['user.passwordResetTokenExpire'];
        return $timestamp + $expire >= time();
    }

    public function generatePasswordResetToken()
    {
        $this->password_reset_token = Yii::$app->security->generateRandomString() . '_' . time();
    }

}
