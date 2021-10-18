<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "profile_contest".
 *
 * @property int $profile_id
 * @property int $contest_id
 *
 * @property Contest $contest
 * @property Profile $profile
 */
class ProfileContest extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'profile_contest';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['profile_id', 'contest_id'], 'required'],
            [['profile_id', 'contest_id'], 'integer'],
            [['contest_id'], 'exist', 'skipOnError' => true, 'targetClass' => Contest::className(), 'targetAttribute' => ['contest_id' => 'id']],
            [['profile_id'], 'exist', 'skipOnError' => true, 'targetClass' => Profile::className(), 'targetAttribute' => ['profile_id' => 'id']],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function attributeLabels()
    {
        return [
            'profile_id' => 'Profile ID',
            'contest_id' => 'Contest ID',
        ];
    }

    /**
     * Gets query for [[Contest]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContest()
    {
        return $this->hasOne(Contest::className(), ['id' => 'contest_id']);
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
