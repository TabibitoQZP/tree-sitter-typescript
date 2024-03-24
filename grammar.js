module.exports = grammar({
  name: 'typescript',

  precedences: $ => [
    ['member',
      'call',
      'unary_void',
      'binary_exp',
      'binary_times',
      'binary_plus',
      'binary_shift',
      'binary_compare',
      'binary_relation',
      'binary_equality',
      'bitwise_and',
      'bitwise_xor',
      'bitwise_or',
      'logical_and',
      'logical_or',
      'ternary'],
    ['assign'],
    ['declaration'],
    [$._expressions, $.binary_expression],
    [$.primary_expression, $.member_expression, $.call_expression, $.subscript_expression],
    [$.binary_expression, $.single_declaration],
    [$._toplevel_statement, $.statement],
    [$.expression_statement, $.expression],
    [$.primary_expression, $.statement_block, 'object'],
  ],

  rules: {
    program: $ => repeat($._toplevel_statement),

    _toplevel_statement: $ => choice(
      $.expression,
      $.declaration, // lab2
      $.statement, // lab2
      $.comment,
    ),
    comment: $=> seq('//', /.*/),

    expression: $ => seq(
      $._expressions,
      optional(";")
    ),

    // lab2
    declaration: $ => choice(
      $.variable_declaration,
      $.function_declaration, // lab2
      // $.function_signature, // lab2
      // $.class_declaration, // lab2
      // $.interface_declaration, // lab2
    ),

    statement: $ => choice(
      $.if_statement,
      $.for_statement,
      $.for_in_statement,
      $.while_statement,
      $.do_statement,
      $.import_statement,
      $.statement_block,
      $.expression_statement,
      $.declaration,
      $.return_statement,
    ),
    return_statement: $ => seq(
      'return',
      optional($._expressions),
      ';',
    ),
    expression_statement: $ => seq(
      $._expressions,
      ';',
    ),

    // lab2 二级
    // statement block
    statement_block: $ => prec.right(seq(
      '{',
      repeat($.statement),
      '}',
      optional(';'),
    )),
    // if statement
    if_statement: $ => prec.right(seq(
      'if',
      field('condition', $.parenthesized_expression),
      field('consequence', $.statement),
      optional(field('alternative', $.else_clause)),
    )),
    parenthesized_expression: $ => seq(
      '(',
      $._expressions,
      ')',
    ),
    else_clause: $ => seq('else', $.statement),

    // for statement
    for_statement: $ => seq(
      'for',
      '(',
      field('initializer', choice(
        $.variable_declaration,
        $.expression_statement,
      )),
      field('condition', choice(
        $.expression_statement,
      )),
      field('increment', optional($._expressions)),
      ')',
      field('body', $.statement),
    ),

    // for in statement
    for_in_statement: $ => seq(
      'for',
      optional('await'),
      $._for_header,
      field('body', $.statement),
    ),
    _for_header: $ => seq(
      '(',
      seq(
        field('kind', choice('let', 'const')),
        field('left', $.identifier),
      ),
      field('operator', choice('in', 'of')),
      field('right', $._expressions),
      ')',
    ),
    // while statement
    while_statement: $ => seq(
      'while',
      field('condition', seq(
        '(',
        $._expressions,
        ')',
      )),
      field('body', $.statement),
    ),
    // do statement
    do_statement: $ => prec.right(seq(
      'do',
      field('body', $.statement),
      'while',
      field('condition', seq(
        '(',
        $._expressions,
        ')',
      )),
      optional(';'),
    )),
    // import statement
    import_statement: $ => seq(
      'import',
      '{',
      commaSep($.identifier),
      '}',
      'from',
      choice($.identifier, $.string),
      optional(';'),
    ),
    function_declaration: $ => prec.right('declaration', seq(
      optional('async'),
      'function',
      field('name', $.identifier),
      optional(seq(
        '<',
        commaSep1($.identifier),
        '>',
      )),
      $._call_signature,
      field('body', $.statement_block),
      optional(';'),
    )),
    _call_signature: $ => field('parameters', $.formal_parameters),
    formal_parameters: $ => seq(
      '(',
      optional(seq(
        commaSep1($.single_declaration),
        optional(','),
      )),
      ')',
    ),

    _expressions: $ => choice(
      $.primary_expression,
    ),

    primary_expression: $ => choice(
      $.assignment_expression,
      $.augmented_assignment_expression,
      $.unary_expression,
      $.binary_expression,
      $.call_expression,
      $.member_expression,
      $.identifier,
      $.string,
      $.decimal_integer_literal,
      $._quote_primary_expression,
      $.array,
      $.object,
      $.subscript_expression, // a[0] 这种的
      $.arrow_function, // () => {} 这类
    ),
    arrow_function: $ => seq(
      optional('async'),
      choice(
        field('parameter', $.identifier),
        $._call_signature,
      ),
      '=>',
      field('body', choice(
        $.expression,
        $.statement_block,
      )),
    ),
    array: $ => seq(
      '[',
      commaSep($._expressions),
      ']',
    ),
    object: $ => prec('object', seq(
      '{',
      commaSep(seq(
        field('key', $.identifier),
        ':',
        field('value', $._expressions)
      )),
      '}',
    )),
    subscript_expression: $ => prec.right('member', seq(
      field('object', $.identifier),
      '[', field('index', $._expressions), ']',
    )),

    assignment_expression: $ => prec.right('assign', seq(
      field('left', $.identifier),
      '=',
      field('right', $.primary_expression),
    )),

    //QZP
    _quote_primary_expression: $ => seq(
      '(',
      $.primary_expression,
      ')',
    ),
    augmented_assignment_expression: $ => prec.right('assign', seq(
      field('left', $.identifier),
      field('operator', choice('+=', '-=', '*=', '/=', '%=', '^=', '&=', '|=', '>>=', '>>>=',
        '<<=', '**=', '&&=', '||=', '??=')),
      field('right', $.primary_expression),
    )),
    unary_expression: $ => prec.left('unary_void', seq(
      field('operator', choice('!', '~', '-', '+', 'typeof', 'void', 'delete')),
      field('argument', $.primary_expression),
    )),
    binary_expression: $ => choice(
      ...[
        ['&&', 'logical_and'],
        ['||', 'logical_or'],
        ['>>', 'binary_shift'],
        ['>>>', 'binary_shift'],
        ['<<', 'binary_shift'],
        ['&', 'bitwise_and'],
        ['^', 'bitwise_xor'],
        ['|', 'bitwise_or'],
        ['+', 'binary_plus'],
        ['-', 'binary_plus'],
        ['*', 'binary_times'],
        ['/', 'binary_times'],
        ['%', 'binary_times'],
        ['**', 'binary_exp', 'right'],
        ['<', 'binary_relation'],
        ['<=', 'binary_relation'],
        ['==', 'binary_equality'],
        ['===', 'binary_equality'],
        ['!=', 'binary_equality'],
        ['!==', 'binary_equality'],
        ['>=', 'binary_relation'],
        ['>', 'binary_relation'],
        ['??', 'ternary'],
        ['instanceof', 'binary_relation'],
        ['in', 'binary_relation'],
      ].map(([operator, precedence, associativity]) =>
        (associativity === 'right' ? prec.right : prec.left)(precedence, seq(
          field('left', $.primary_expression),
          field('operator', operator),
          field('right', $.primary_expression),
        )),
      ),
    ),
    call_expression: $ => choice(
      prec('call', seq(
        field('function', $.identifier),
        '(',
        commaSep($.primary_expression),
        ')',
      )),
    ),
    member_expression: $ => choice(
      prec('call', seq(
        sep1($.identifier, '.'),
        '.',
        $.call_expression,
      )),
    ),
    single_declaration: $ => seq(
      $.identifier,
      optional(seq(':', choice('boolean', 'number', 'string', $.identifier))),
      optional('[]'),
      optional(seq('=', $.primary_expression))
    ),
    variable_declaration: $ => seq(
      choice('var', 'let', 'const'),
      commaSep1($.single_declaration),
      optional(';'),
    ),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
    string: $ => choice(/"[^"]*"/, /'[^']*'/),

    decimal_integer_literal: $ => token(choice('0', seq(/[1-9]/, optional(seq(optional('_'), sep1(/[0-9]+/, /_+/))))))
  }
});

function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}