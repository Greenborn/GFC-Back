<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "fotoclub".
 *
 * @property int $id
 * @property string|null $name
 *
 * @property Profile[] $profiles
 */
class Fotoclub extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'fotoclub';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['name', 'facebook', 'instagram', 'email'], 'string', 'max' => 45],
            [['description', 'photo_url'], 'string', 'max' => 255],
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
            'facebook' => 'Facebook',
            'instagram' => 'Instagram',
            'email' => 'Email',
            'photo_url' => 'Photo',
            'description' => 'Description'
        ];
    }

    /**
     * Gets query for [[Profiles]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfiles()
    {
        return $this->hasMany(Profile::className(), ['fotoclub_id' => 'id']);
    }
}
