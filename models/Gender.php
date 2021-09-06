<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "gender".
 *
 * @property int $id
 * @property string $type
 *
 * @property Profile[] $profiles
 * @property Profile[] $profiles0
 */
class Gender extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'gender';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['type'], 'required'],
            [['type'], 'string', 'max' => 45],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'type' => 'Type',
        ];
    }

    /**
     * Gets query for [[Profiles]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfiles()
    {
        return $this->hasMany(Profile::className(), ['gender_id' => 'id'])->inverseOf('gender');
    }

    /**
     * Gets query for [[Profiles0]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfiles0()
    {
        return $this->hasMany(Profile::className(), ['gender_preference_id' => 'id'])->inverseOf('genderPreference');
    }
}
