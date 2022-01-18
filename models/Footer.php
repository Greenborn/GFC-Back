<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "footer".
 *
 * @property int $id
 * @property string|null $address
 * @property string|null $email
 * @property string|null $phone
 *
 */
class Footer extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'footer';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['instagram','youtube', 'facebook', 'email'], 'string', 'max' => 45],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'facebook' => 'Facebook',
            'youtube' => 'Youtube',
            'instagram' => 'Instagram',
            'email' => 'Email',
        ];
    }

}
