<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "profile".
 *
 * @property int $id
 * @property string|null $name
 * @property string|null $last_name
 * @property int $fotoclub_id
 *
 * @property Fotoclub $fotoclub
 * @property ProfileContest[] $profileContests
 * @property User[] $users
 */
class Profile extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'profile';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['fotoclub_id'], 'required'],
            [['fotoclub_id'], 'integer'],
            [['name'], 'string', 'max' => 59],
            [['last_name'], 'string', 'max' => 50],
            [['fotoclub_id'], 'exist', 'skipOnError' => true, 'targetClass' => Fotoclub::className(), 'targetAttribute' => ['fotoclub_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'name' => 'Name',
            'last_name' => 'Last Name',
            'fotoclub_id' => 'Fotoclub ID',
        ];
    }

    /**
     * Gets query for [[Fotoclub]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getFotoclub()
    {
        return $this->hasOne(Fotoclub::className(), ['id' => 'fotoclub_id']);
    }

    /**
     * Gets query for [[ProfileContests]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfileContests()
    {
        return $this->hasMany(ProfileContest::className(), ['profile_id' => 'id']);
    }

    /**
     * Gets query for [[Users]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getUsers()
    {
        return $this->hasMany(User::className(), ['profile_id' => 'id']);
    }
}
