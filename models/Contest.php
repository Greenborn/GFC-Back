<?php

namespace app\models;

use Yii;

/**
 * This is the model class for table "contest".
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string|null $start_date
 * @property string|null $end_date
 *
 * @property ContestCategory[] $contestCategories
 * @property ContestResult[] $contestResults
 * @property ContestSection[] $contestSections
 * @property ProfileContest[] $profileContests
 */
class Contest extends \yii\db\ActiveRecord
{
    /**
     * {@inheritdoc}
     */
    public static function tableName()
    {
        return 'contest';
    }

    /**
     * {@inheritdoc}
     */
    public function rules()
    {
        return [
            [['name'], 'required'],
            [['description'], 'string'],
            [['name'], 'string', 'max' => 45],
            [['start_date', 'end_date'], 'string', 'max' => 12],
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
            'description' => 'Description',
            'start_date' => 'Start Date',
            'end_date' => 'End Date',
        ];
    }

    /**
     * Gets query for [[ContestCategories]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestCategories()
    {
        return $this->hasMany(ContestCategory::className(), ['contest_id' => 'id']);
    }

    /**
     * Gets query for [[ContestResults]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestResults()
    {
        return $this->hasMany(ContestResult::className(), ['contest_id' => 'id']);
    }

    /**
     * Gets query for [[ContestSections]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getContestSections()
    {
        return $this->hasMany(ContestSection::className(), ['contest_id' => 'id']);
    }

    /**
     * Gets query for [[ProfileContests]].
     *
     * @return \yii\db\ActiveQuery
     */
    public function getProfileContests()
    {
        return $this->hasMany(ProfileContest::className(), ['contest_id' => 'id']);
    }
}
