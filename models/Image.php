<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "image".
 *
 * @property int $id
 * @property string $code
 * @property string $title
 * @property int $profile_id
 *
 * @property ContestResult[] $contestResults
 */
class Image extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'image';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['code', 'title', 'profile_id'], 'required'],
            [['profile_id'], 'integer'],
            [['code'], 'string', 'max' => 20],
            [['title'], 'string', 'max' => 45],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'id' => 'ID',
            'code' => 'Code',
            'title' => 'Title',
            'profile_id' => 'Profile ID',
        ];
    }

    /**
     * Gets query for [[ContestResults]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestResults()
    {
        return $this->hasMany(ContestResult::className(), ['image_id' => 'id']);
    }

        /**
     * Gets query for [[Profile]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfile()
    {
        return $this->hasOne(Profile::className(), ['id' => 'profile_id']);
    }

    public function extraFields() {
        return [ 'profile' ];
    }
}
