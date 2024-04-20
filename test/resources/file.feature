Feature: Guess the word

  The word guess game is a turn-based game for two players.
  The Maker makes a word for the Breaker to guess. The game
  is over when the Breaker guesses the Maker's word.

  Scenario: Maker starts a game
    When test before comment
    When the Maker starts a game
    Then the Maker waits for a Breaker to join

  Scenario: Breaker joins a game
    Given the Maker has started a game with the word "silky"
    When the Breaker joins the Maker's game
    Then the Breaker must guess a word with 5 characters

  Scenario: Multiple Tags

    This is the scenario description

    Given one thing
    And another thing
    And yet another thing
    * I open my eyes
    Then I should see something
    But I shouldn't see something else
