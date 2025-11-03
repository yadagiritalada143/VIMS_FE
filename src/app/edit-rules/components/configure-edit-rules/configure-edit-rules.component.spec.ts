import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ConfigureEditRulesComponent } from './configure-edit-rules.component';

describe('ConfigureEditRulesComponent', () => {
  let component: ConfigureEditRulesComponent;
  let fixture: ComponentFixture<ConfigureEditRulesComponent>;
  CommonTestingModule.setUpTestBed(ConfigureEditRulesComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureEditRulesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureEditRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
