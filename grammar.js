module.exports = grammar({
  name: 'typescript',

  extras: $ => [$.comment, /[\s\p{Zs}\uFEFF\u2028\u2029\u2060\u200B]/],

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
    [$.assignment_expression, $.primary_expression],
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
    ),
    comment: $ => choice(
      token(choice(
        seq('//', /.*/),
        seq(
          '/*',
          /[^*]*\*+([^/*][^*]*\*+)*/,
          '/',
        ),
      )),
    ),

    expression: $ => seq(
      $._expressions,
      optional(";")
    ),

    // lab2
    declaration: $ => choice(
      $.variable_declaration,
      $.function_declaration, // lab2
      $.function_signature, // lab2
      $.class_declaration, // lab2
      $.interface_declaration, // lab2
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
    // function declaration
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
      optional(seq(':', $.identifier)),
      field('body', $.statement_block),
      optional(';'),
    )),
    // class declaration
    class_declaration: $ => prec.right('declaration', seq(
      repeat($.decorator),
      'class',
      field('name', $.identifier),
      optional(seq(
        'extends',
        field('extends', $.identifier),
        optional(seq('<', $.identifier, '>'))
      )),
      optional(seq(
        'implements',
        field('implements', $.identifier),
        optional(seq('<', $.identifier, '>'))
      )),
      optional(seq('<', $.identifier, 'extends', $.identifier)),
      field('body', $.class_body),
    )),

    // interface declaration
    interface_declaration: $ => seq(
      optional('export'),
      'interface',
      field('name', $.identifier),
      optional(seq('extends', field('extends', $.identifier))),
      optional(seq('<', $.identifier, 'extends', $.identifier, '>')),
      field('body', $.interface_body),
    ),
    // function signature
    function_signature: $ => seq(
      'function',
      field('name', $.identifier),
      $._call_signature,
      ':',
      $.identifier,
      ';',
    ),
    interface_body: $ => seq(
      '{',
      repeat(seq(choice($.single_declaration, $.method_signature, $.property_signature, $.index_signature), optional(';'))),
      '}'
    ),
    method_signature: $ => seq(
      field('name', $.identifier),
      $._call_signature,
      ':',
      $.identifier,
    ),
    index_signature: $ => seq(
      '[',
      commaSep(seq($.identifier, ':', $.identifier)),
      ']',
      ':',
      $.identifier,
    ),
    property_signature: $ => seq(
      field('name', $.identifier),
      ':',
      $._call_signature,
      '=>',
      $.identifier,
    ),
    decorator: $ => seq(
      '@',
      choice($.identifier, $.member_expression),
      optional(seq('(', commaSep($.primary_expression), ')', optional(','))),
    ),
    class_body: $ => seq(
      '{',
      repeat(choice(
        seq($.single_declaration, ';'),
        seq(field('member', $.method_definition), optional(';')),
      )),
      '}',
    ),
    method_definition: $ => seq(
      optional($.decorator),
      field('name', $.identifier),
      $._call_signature,
      optional(seq(':', $.identifier)),
      field('body', $.statement_block),
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
      $.arrow_function, // 用于实现()=>{}形式
      $.function_expression, //用于实现function(){}形式, 本质和上面一样
      $.template_string, // lab2 需要实现
      $._call_signature, // 实现括号内部, 否则每次现场正则太烦了
    ),
    template_string: $ => /`[^`]*`/,
    function_expression: $ => seq(
      'function',
      $._call_signature,
      $.statement_block,
    ),
    arrow_function: $ => seq(
      choice($.identifier, $._call_signature),
      '=>',
      $._expressions,
    ),
    _call_signature: $ => seq(
      '(',
      choice(commaSep(seq(
        optional(choice('const', 'public', 'private')),
        $.identifier,
        ':',
        choice(
          seq($.identifier, optional('[]')), // type[] 格式
          $.arrow_function, // ()=>{}
        ),
        optional(seq(
          '=',
          $._expressions,
        )),
      )),
      seq('...', 'args', ':', 'any', '[]'),
      ),
      optional(','),
      ')'
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
      field('left', choice($.member_expression, $.identifier)),
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
        sep1(choice($.call_expression, $.identifier), '.'),
        '.',
        choice($.call_expression, $.identifier),
      )),
    ),
    single_declaration: $ => seq(
      $.identifier,
      optional(seq(':', $.identifier)),
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