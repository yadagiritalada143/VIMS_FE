import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonTestingModule } from 'src/testing/commontest.module';
import { ListEditRulesComponent } from './list-edit-rules.component';

describe('ListEditRulesComponent', () => {
  let component: ListEditRulesComponent;
  let fixture: ComponentFixture<ListEditRulesComponent>;
  CommonTestingModule.setUpTestBed(ListEditRulesComponent);
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListEditRulesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListEditRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
